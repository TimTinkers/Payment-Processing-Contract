pragma solidity ^0.5.8;


/**
 * @title SafeMath
 * @dev Math operations with safety checks that throw on error
 */
library SafeMath {

  /**
  * @dev Multiplies two numbers, throws on overflow.
  */
  function mul(uint256 a, uint256 b) internal pure returns (uint256) {
    if (a == 0) {
      return 0;
    }
    uint256 c = a * b;
    assert(c / a == b);
    return c;
  }

  /**
  * @dev Integer division of two numbers, truncating the quotient.
  */
  function div(uint256 a, uint256 b) internal pure returns (uint256) {
    // assert(b > 0); // Solidity automatically throws when dividing by 0
    uint256 c = a / b;
    // assert(a == b * c + a % b); // There is no case in which this doesn't hold
    return c;
  }

  /**
  * @dev Substracts two numbers, throws on overflow (i.e. if subtrahend is greater than minuend).
  */
  function sub(uint256 a, uint256 b) internal pure returns (uint256) {
    assert(b <= a);
    return a - b;
  }

  /**
  * @dev Adds two numbers, throws on overflow.
  */
  function add(uint256 a, uint256 b) internal pure returns (uint256) {
    uint256 c = a + b;
    assert(c >= a);
    return c;
  }
}


contract PaymentProcessor {
  using SafeMath for uint256;

  // Payment processor name.
  string private _name;

  // The first party to receive withdrawals.
  address payable private _firstParty;

  // The second party to receive withdrawals.
  address payable private _secondParty;

  // The identifier to use for the next service offered.
  uint256 private _nextServiceId = 0;

  // The names of each service offered by this processor.
  mapping (uint256 => string) private _serviceNames;

  // The cost in wei for each service offered by this processor.
  mapping (uint256 => uint256) private _serviceCosts;

  // Whether or not a particular service is enabled for use.
  mapping (uint256 => bool) private _serviceEnabled;

  // A mapping to record all services purchased by a given address.
  mapping (address => uint256[]) private _purchases;

  // A mapping to record all orders purchased by a given address as a delimited string.
  mapping (address => string) private _orders;

  // The pot containing the first party's income.
  uint256 _firstPartyPot;

  // The pot containing the second party's income.
  uint256 _secondPartyPot;

  // Construct this payment processor.
  constructor(string memory name, address payable firstParty, address payable secondParty) public {
    _name = name;
    _firstParty = firstParty;
    _secondParty = secondParty;
  }

  // Get the payment processor's name.
  function getName() public view returns (string memory name) {
    return _name;
  }

  // Get the payment processor's first party.
  function getFirstParty() public view returns (address firstParty) {
    return _firstParty;
  }

  // Get the payment processor's second party.
  function getSecondParty() public view returns (address secondParty) {
    return _secondParty;
  }

  // Get the next available service identifier.
  function getNextServiceId() public view returns (uint256 nextServiceId) {
    return _nextServiceId;
  }

  // Get a specified service's name.
  function getServiceName(uint256 serviceId) public view returns (string memory name) {
    return _serviceNames[serviceId];
  }

  // Get a specified service's cost.
  function getServiceCost(uint256 serviceId) public view returns (uint256 cost) {
    return _serviceCosts[serviceId];
  }

  // Get a specified service's enabled state.
  function getServiceEnabled(uint256 serviceId) public view returns (bool enabled) {
    return _serviceEnabled[serviceId];
  }

  // Returns a user's purchases.
  function getPurchases(address purchaser) public view returns (uint256[] memory purchaseHistory) {
    return _purchases[purchaser];
  }

  // Returns a user's orders.
  function getOrders(address purchaser) public view returns (string memory orderHistory) {
    return _orders[purchaser];
  }

  // Get the value of the first party's pot.
  function getFirstPartyPot() public view returns (uint256 firstPartyPot) {
    return _firstPartyPot;
  }

  // Get the value of the second party's pot.
  function getSecondPartyPot() public view returns (uint256 secondPartyPot) {
    return _secondPartyPot;
  }

  // This modifier allows interaction only from the first party address.
  modifier onlyFirst {
    require(msg.sender == _firstParty);
    _;
  }

  // This modifier allows interaction only from the second party address.
  modifier onlySecond {
    require(msg.sender == _secondParty);
    _;
  }

  // This modifier allows interaction only from the addresses party to this contract.
  modifier onlyParties {
    require(msg.sender == _firstParty || msg.sender == _secondParty);
    _;
  }

  // Add a new service to this payment processor.
  function addService(string memory name, uint256 cost) onlyParties public {
    _serviceNames[_nextServiceId] = name;
    _serviceCosts[_nextServiceId] = cost;
    _serviceEnabled[_nextServiceId] = true;
    _nextServiceId++;
  }

  // Updates the status of an existing service offered by this payment processor.
  function updateService(uint256 serviceId, string memory name, uint256 cost, bool enabled) onlyParties public {
    require(serviceId < _nextServiceId);
    _serviceNames[serviceId] = name;
    _serviceCosts[serviceId] = cost;
    _serviceEnabled[serviceId] = enabled;
  }

  // Allows the first party to select a new address to serve in its stead.
  function updateFirstParty(address payable newFirstParty) onlyFirst public {
    _firstParty = newFirstParty;
  }

  // Allows the second party to select a new address to serve in its stead.
  function updateSecondParty(address payable newSecondParty) onlySecond public {
    _secondParty = newSecondParty;
  }

  // Allows a user to purchase a service.
  function purchase(uint256 serviceId, string memory orderId) payable public {
    require(msg.value >= _serviceCosts[serviceId]);
    _purchases[msg.sender].push(serviceId);
    _orders[msg.sender] = string(abi.encodePacked(_orders[msg.sender], ';', orderId));
    uint256 firstPortion = msg.value.div(2);
    uint256 secondPortion = msg.value.sub(firstPortion);
    _firstPartyPot = _firstPartyPot.add(firstPortion);
    _secondPartyPot = _secondPartyPot.add(secondPortion);
  }

  // Allows the first party to withdraw their funds.
  function withdrawFirst() onlyFirst public {
    require(_firstPartyPot > 0);
    _firstPartyPot = 0;
    _firstParty.transfer(_firstPartyPot);
  }

  // Allows the second party to withdraw their funds.
  function withdrawSecond() onlySecond public {
    require(_secondPartyPot > 0);
    _secondPartyPot = 0;
    _secondParty.transfer(_secondPartyPot);
  }
}

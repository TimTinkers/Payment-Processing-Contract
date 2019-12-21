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

  // A mapping to record all orders purchased by a given address as a delimited string.
  mapping (address => string) private _orders;

  // A mapping to record the amount paid by a given address towards each order.
  mapping (address => uint256[]) private _payments;

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

  // Returns a user's orders.
  function getOrders(address purchaser) public view returns (string memory orderHistory) {
    return _orders[purchaser];
  }

  // Returns a user's payments.
  function getPayments(address purchaser) public view returns (uint256[] memory paymentHistory) {
    return _payments[purchaser];
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

  // Allows the first party to select a new address to serve in its stead.
  function updateFirstParty(address payable newFirstParty) onlyFirst public {
    _firstParty = newFirstParty;
  }

  // Allows the second party to select a new address to serve in its stead.
  function updateSecondParty(address payable newSecondParty) onlySecond public {
    _secondParty = newSecondParty;
  }

  // Allows a user to purchase a service.
  function purchase(string memory orderId) payable public {
    _payments[msg.sender].push(msg.value);
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

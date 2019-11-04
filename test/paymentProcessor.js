/**
 * A file to specify tests for the PaymentProcessor.
 *
 * @author Tim Clancy
 * @version 1.0.0
 * @date 11.4.2019
 */

// Imports and testing requirements.
const { ether, time, EVMRevert } = require('openzeppelin-test-helpers');
const BigNumber = web3.utils.BN;
require('chai')
	.use(require('chai-as-promised'))
	.use(require('chai-bignumber')(BigNumber))
	.should();

// Import and test the PaymentProcessor.
const PaymentProcessor = artifacts.require('PaymentProcessor');
contract('PaymentProcessor', function ([ firstParty, secondParty, player, updatedFirstParty, updatedSecondParty ]) {

	// Testing constants.
	const ZERO = new BigNumber(0);
	const ONE_HALF = new BigNumber(0.5);
	const ONE = new BigNumber(1);
	const ONE_AND_ONE_HALF = new BigNumber(1.5);
	const TWO = new BigNumber(2);
	const TWO_AND_ONE_HALF = new BigNumber(2.5);
	const THREE = new BigNumber(3);

	// Before conducting any tests, advance to the next block to correctly read
	// time in the solidity "now" function interpreted by testrpc.
	before(async function () {
		await time.advanceBlock();
	});

	// Before executing each test case, create a new PaymentProcessor
	// instance with the specified testing parameters.
	const PROCESSOR_NAME = 'Dissolution';
	beforeEach(async function () {
		this.processor = await PaymentProcessor.new(PROCESSOR_NAME, firstParty, secondParty);
	});

	// The processor should start with the correct initial state.
	it('Verify processor has correct initial state.',
	async function () {

		// Verify the processor instance exists.
		this.processor.should.exist;

		// Retrieve counts from the exchange instance.
		const name = await this.processor.getName();
		const outFirstParty = await this.processor.getFirstParty();
		const outSecondParty = await this.processor.getSecondParty();
		const nextServiceId = await this.processor.getNextServiceId();

		// Verify that they match the expected values.
		name.should.equal(PROCESSOR_NAME);
		outFirstParty.should.equal(firstParty);
		outSecondParty.should.equal(secondParty);
		nextServiceId.should.be.bignumber;
		assert(nextServiceId.eq(ZERO));
	});

	// Verify that either party can add or update a service.
	it('Verify processor parties can manipulate services.', async function () {

		// Verify the processor starts with no services.
		let nextServiceId = await this.processor.getNextServiceId();
		nextServiceId.should.be.bignumber;
		assert(nextServiceId.eq(ZERO));

		// Have the first party add a new service.
		let newServiceName = 'test';
		let newServiceCost = ether(ONE);
		await this.processor.addService(newServiceName, newServiceCost, { from: firstParty }).should.be.fulfilled;

		// Verify the service was added.
		let serviceName = await this.processor.getServiceName(0);
		let serviceCost = await this.processor.getServiceCost(0);
		let serviceEnabled = await this.processor.getServiceEnabled(0);
		nextServiceId = await this.processor.getNextServiceId();
		serviceName.should.equal(newServiceName);
		serviceCost.should.be.bignumber;
		assert(serviceCost.eq(newServiceCost));
		serviceEnabled.should.be.true;
		nextServiceId.should.be.bignumber;
		assert(nextServiceId.eq(ONE));

		// Have the second party add a new service.
		newServiceName = 'test2';
		newServiceCost = ether(TWO);
		await this.processor.addService(newServiceName, newServiceCost, { from: secondParty }).should.be.fulfilled;

		// Verify the service was added.
		serviceName = await this.processor.getServiceName(1);
		serviceCost = await this.processor.getServiceCost(1);
		serviceEnabled = await this.processor.getServiceEnabled(1);
		nextServiceId = await this.processor.getNextServiceId();
		serviceName.should.equal(newServiceName);
		serviceCost.should.be.bignumber;
		assert(serviceCost.eq(newServiceCost));
		serviceEnabled.should.be.true;
		nextServiceId.should.be.bignumber;
		assert(nextServiceId.eq(TWO));

		// Verify that the first party can update the second party's service.
		newServiceName = 'test3';
		newServiceCost = ether(ONE);
		await this.processor.updateService(1, newServiceName, newServiceCost, false, { from: firstParty }).should.be.fulfilled;

		// Verify the service was updated.
		serviceName = await this.processor.getServiceName(1);
		serviceCost = await this.processor.getServiceCost(1);
		serviceEnabled = await this.processor.getServiceEnabled(1);
		nextServiceId = await this.processor.getNextServiceId();
		serviceName.should.equal(newServiceName);
		serviceCost.should.be.bignumber;
		assert(serviceCost.eq(newServiceCost));
		serviceEnabled.should.be.false;
		nextServiceId.should.be.bignumber;
		assert(nextServiceId.eq(TWO));

		// Verify that the second party can update the first party's service.
		newServiceName = 'test4';
		newServiceCost = ether(TWO);
		await this.processor.updateService(0, newServiceName, newServiceCost, false, { from: secondParty }).should.be.fulfilled;

		// Verify the service was updated.
		serviceName = await this.processor.getServiceName(0);
		serviceCost = await this.processor.getServiceCost(0);
		serviceEnabled = await this.processor.getServiceEnabled(0);
		nextServiceId = await this.processor.getNextServiceId();
		serviceName.should.equal(newServiceName);
		serviceCost.should.be.bignumber;
		assert(serviceCost.eq(newServiceCost));
		serviceEnabled.should.be.false;
		nextServiceId.should.be.bignumber;
		assert(nextServiceId.eq(TWO));
	});

	// The parties cannot update non-existent services.
	it('Verify the processor rejects non-existent updates.', async function () {

		// Verify the processor starts with no services.
		let nextServiceId = await this.processor.getNextServiceId();
		nextServiceId.should.be.bignumber;
		assert(nextServiceId.eq(ZERO));

		// Have the first party try to update a non-existent service.
		let newServiceName = 'test';
		let newServiceCost = ether(ONE);
		await this.processor.updateService(0, newServiceName, newServiceCost, true, { from: firstParty }).should.be.rejectedWith(EVMRevert);

		// Have the second party try to update a non-existent service.
		newServiceName = 'test';
		newServiceCost = ether(ONE);
		await this.processor.updateService(0, newServiceName, newServiceCost, true, { from: secondParty }).should.be.rejectedWith(EVMRevert);
	});

	// Non-party users cannot manipulate services.
	it('Verify processor non-parties cannot manipulate services.', async function () {

		// Verify the processor starts with no services.
		let nextServiceId = await this.processor.getNextServiceId();
		nextServiceId.should.be.bignumber;
		assert(nextServiceId.eq(ZERO));

		// Have the first party add a new service.
		let newServiceName = 'test';
		let newServiceCost = ether(ONE);
		await this.processor.addService(newServiceName, newServiceCost, { from: firstParty }).should.be.fulfilled;

		// Verify the service was added.
		let serviceName = await this.processor.getServiceName(0);
		let serviceCost = await this.processor.getServiceCost(0);
		let serviceEnabled = await this.processor.getServiceEnabled(0);
		nextServiceId = await this.processor.getNextServiceId();
		serviceName.should.equal(newServiceName);
		serviceCost.should.be.bignumber;
		assert(serviceCost.eq(newServiceCost));
		serviceEnabled.should.be.true;
		nextServiceId.should.be.bignumber;
		assert(nextServiceId.eq(ONE));

		// A non-party cannot add or update a service.
		await this.processor.addService(newServiceName, newServiceCost, { from: player }).should.be.rejectedWith(EVMRevert);
		await this.processor.updateService(0, newServiceName, newServiceCost, false, { from: player }).should.be.rejectedWith(EVMRevert);
	});

	// The first party can update its own addresses.
	it('Verify the first party can update its own address.', async function () {

		// Verify the processor starts with no services.
		let nextServiceId = await this.processor.getNextServiceId();
		nextServiceId.should.be.bignumber;
		assert(nextServiceId.eq(ZERO));

		// Have the first party add a new service.
		let newServiceName = 'test';
		let newServiceCost = ether(ONE);
		await this.processor.addService(newServiceName, newServiceCost, { from: firstParty }).should.be.fulfilled;

		// Verify the service was added.
		let serviceName = await this.processor.getServiceName(0);
		let serviceCost = await this.processor.getServiceCost(0);
		let serviceEnabled = await this.processor.getServiceEnabled(0);
		nextServiceId = await this.processor.getNextServiceId();
		serviceName.should.equal(newServiceName);
		serviceCost.should.be.bignumber;
		assert(serviceCost.eq(newServiceCost));
		serviceEnabled.should.be.true;
		nextServiceId.should.be.bignumber;
		assert(nextServiceId.eq(ONE));

		// Verify that the first party can update itself.
		let outFirstParty = await this.processor.getFirstParty();
		outFirstParty.should.equal(firstParty);
		await this.processor.updateFirstParty(updatedFirstParty, { from: firstParty }).should.be.fulfilled;
		outFirstParty = await this.processor.getFirstParty();
		outFirstParty.should.equal(updatedFirstParty);

		// Verify that the old first party is no longer a party.
		await this.processor.addService(newServiceName, newServiceCost, { from: firstParty }).should.be.rejectedWith(EVMRevert);
		await this.processor.updateService(0, newServiceName, newServiceCost, false, { from: firstParty }).should.be.rejectedWith(EVMRevert);

		// Have the new first party add a new service.
		newServiceName = 'test2';
		newServiceCost = ether(TWO);
		await this.processor.addService(newServiceName, newServiceCost, { from: updatedFirstParty }).should.be.fulfilled;

		// Verify the service was added.
		serviceName = await this.processor.getServiceName(1);
		serviceCost = await this.processor.getServiceCost(1);
		serviceEnabled = await this.processor.getServiceEnabled(1);
		nextServiceId = await this.processor.getNextServiceId();
		serviceName.should.equal(newServiceName);
		serviceCost.should.be.bignumber;
		assert(serviceCost.eq(newServiceCost));
		serviceEnabled.should.be.true;
		nextServiceId.should.be.bignumber;
		assert(nextServiceId.eq(TWO));
	});

	// The second party can update its own addresses.
	it('Verify the second party can update its own address.', async function () {

		// Verify the processor starts with no services.
		let nextServiceId = await this.processor.getNextServiceId();
		nextServiceId.should.be.bignumber;
		assert(nextServiceId.eq(ZERO));

		// Have the second party add a new service.
		let newServiceName = 'test';
		let newServiceCost = ether(ONE);
		await this.processor.addService(newServiceName, newServiceCost, { from: secondParty }).should.be.fulfilled;

		// Verify the service was added.
		let serviceName = await this.processor.getServiceName(0);
		let serviceCost = await this.processor.getServiceCost(0);
		let serviceEnabled = await this.processor.getServiceEnabled(0);
		nextServiceId = await this.processor.getNextServiceId();
		serviceName.should.equal(newServiceName);
		serviceCost.should.be.bignumber;
		assert(serviceCost.eq(newServiceCost));
		serviceEnabled.should.be.true;
		nextServiceId.should.be.bignumber;
		assert(nextServiceId.eq(ONE));

		// Verify that the second party can update itself.
		let outSecondParty = await this.processor.getSecondParty();
		outSecondParty.should.equal(secondParty);
		await this.processor.updateSecondParty(updatedSecondParty, { from: secondParty }).should.be.fulfilled;
		outSecondParty = await this.processor.getSecondParty();
		outSecondParty.should.equal(updatedSecondParty);

		// Verify that the old second party is no longer a party.
		await this.processor.addService(newServiceName, newServiceCost, { from: secondParty }).should.be.rejectedWith(EVMRevert);
		await this.processor.updateService(0, newServiceName, newServiceCost, false, { from: secondParty }).should.be.rejectedWith(EVMRevert);

		// Have the new second party add a new service.
		newServiceName = 'test2';
		newServiceCost = ether(TWO);
		await this.processor.addService(newServiceName, newServiceCost, { from: updatedSecondParty }).should.be.fulfilled;

		// Verify the service was added.
		serviceName = await this.processor.getServiceName(1);
		serviceCost = await this.processor.getServiceCost(1);
		serviceEnabled = await this.processor.getServiceEnabled(1);
		nextServiceId = await this.processor.getNextServiceId();
		serviceName.should.equal(newServiceName);
		serviceCost.should.be.bignumber;
		assert(serviceCost.eq(newServiceCost));
		serviceEnabled.should.be.true;
		nextServiceId.should.be.bignumber;
		assert(nextServiceId.eq(TWO));
	});

	// Only a party owner can update itself.
	it('Verify processor only allows updates to addresses from their owner.', async function () {

		// Only the first party can update the first party.
		await this.processor.updateFirstParty(player, { from: player }).should.be.rejectedWith(EVMRevert);
		await this.processor.updateFirstParty(secondParty, { from: secondParty }).should.be.rejectedWith(EVMRevert);
		await this.processor.updateFirstParty(updatedFirstParty, { from: firstParty }).should.be.fulfilled;

		// Only the second party can update the second party.
		await this.processor.updateSecondParty(player, { from: player }).should.be.rejectedWith(EVMRevert);
		await this.processor.updateSecondParty(firstParty, { from: firstParty }).should.be.rejectedWith(EVMRevert);
		await this.processor.updateSecondParty(updatedSecondParty, { from: secondParty }).should.be.fulfilled;
	});

	// Users can purchase services and have that logged somewhere.
	it('Verify users can purchase services.', async function () {

		// Verify the processor starts with no services.
		let nextServiceId = await this.processor.getNextServiceId();
		nextServiceId.should.be.bignumber;
		assert(nextServiceId.eq(ZERO));

		// Have the second party add a new service.
		let newServiceName = 'test';
		let newServiceCost = ether(ONE);
		await this.processor.addService(newServiceName, newServiceCost, { from: secondParty }).should.be.fulfilled;

		// Verify the service was added.
		let serviceName = await this.processor.getServiceName(0);
		let serviceCost = await this.processor.getServiceCost(0);
		let serviceEnabled = await this.processor.getServiceEnabled(0);
		nextServiceId = await this.processor.getNextServiceId();
		serviceName.should.equal(newServiceName);
		serviceCost.should.be.bignumber;
		assert(serviceCost.eq(newServiceCost));
		serviceEnabled.should.be.true;
		nextServiceId.should.be.bignumber;
		assert(nextServiceId.eq(ONE));

		// Record the starting balances of all parties.
		let firstPartyPot = await this.processor.getFirstPartyPot();
		let secondPartyPot = await this.processor.getSecondPartyPot();
		firstPartyPot.should.be.bignumber;
		assert(firstPartyPot.eq(ZERO));
		secondPartyPot.should.be.bignumber;
		assert(secondPartyPot.eq(ZERO));

		// Verify that a user may purchase the service.
		await this.processor.purchase(0, { from: player, value: ether(ONE) }).should.be.fulfilled;
		let purchases = await this.processor.getPurchases(player);
		purchases[0].should.be.bignumber;
		assert(purchases[0].eq(ZERO));
		firstPartyPot = await this.processor.getFirstPartyPot();
		secondPartyPot = await this.processor.getSecondPartyPot();
		firstPartyPot.should.be.bignumber;
		assert(firstPartyPot.eq(ether('0.5')));
		secondPartyPot.should.be.bignumber;
		assert(secondPartyPot.eq(ether('0.5')));

		// Have the second party add a new service.
		newServiceName = 'test1';
		newServiceCost = ether(TWO);
		await this.processor.addService(newServiceName, newServiceCost, { from: secondParty }).should.be.fulfilled;

		// Verify the service was added.
		serviceName = await this.processor.getServiceName(1);
		serviceCost = await this.processor.getServiceCost(1);
		serviceEnabled = await this.processor.getServiceEnabled(1);
		nextServiceId = await this.processor.getNextServiceId();
		serviceName.should.equal(newServiceName);
		serviceCost.should.be.bignumber;
		assert(serviceCost.eq(newServiceCost));
		serviceEnabled.should.be.true;
		nextServiceId.should.be.bignumber;
		assert(nextServiceId.eq(TWO));

		// Verify that a user may purchase the service.
		await this.processor.purchase(1, { from: player, value: ether(TWO) }).should.be.fulfilled;
		purchases = await this.processor.getPurchases(player);
		purchases[1].should.be.bignumber;
		assert(purchases[1].eq(ONE));
		firstPartyPot = await this.processor.getFirstPartyPot();
		secondPartyPot = await this.processor.getSecondPartyPot();
		firstPartyPot.should.be.bignumber;
		assert(firstPartyPot.eq(ether('1.5')));
		secondPartyPot.should.be.bignumber;
		assert(secondPartyPot.eq(ether('1.5')));

		// Verify that a user may purchase duplicates of a service.
		await this.processor.purchase(1, { from: player, value: ether(TWO) }).should.be.fulfilled;
		purchases = await this.processor.getPurchases(player);
		purchases[2].should.be.bignumber;
		assert(purchases[2].eq(ONE));
		firstPartyPot = await this.processor.getFirstPartyPot();
		secondPartyPot = await this.processor.getSecondPartyPot();
		firstPartyPot.should.be.bignumber;
		assert(firstPartyPot.eq(ether('2.5')));
		secondPartyPot.should.be.bignumber;
		assert(secondPartyPot.eq(ether('2.5')));

		// Verify that a user may purchase duplicates of a service.
		await this.processor.purchase(0, { from: player, value: ether(ONE) }).should.be.fulfilled;
		purchases = await this.processor.getPurchases(player);
		purchases[3].should.be.bignumber;
		assert(purchases[3].eq(ZERO));
		firstPartyPot = await this.processor.getFirstPartyPot();
		secondPartyPot = await this.processor.getSecondPartyPot();
		firstPartyPot.should.be.bignumber;
		assert(firstPartyPot.eq(ether('3')));
		secondPartyPot.should.be.bignumber;
		assert(secondPartyPot.eq(ether('3')));
	});

	// Service purchases cannot be fulfilled with partial payment.
	it('Verify that partial payments are rejected.', async function () {

		// Verify the processor starts with no services.
		let nextServiceId = await this.processor.getNextServiceId();
		nextServiceId.should.be.bignumber;
		assert(nextServiceId.eq(ZERO));

		// Have the second party add a new service.
		let newServiceName = 'test';
		let newServiceCost = ether(ONE);
		await this.processor.addService(newServiceName, newServiceCost, { from: secondParty }).should.be.fulfilled;

		// Verify the service was added.
		let serviceName = await this.processor.getServiceName(0);
		let serviceCost = await this.processor.getServiceCost(0);
		let serviceEnabled = await this.processor.getServiceEnabled(0);
		nextServiceId = await this.processor.getNextServiceId();
		serviceName.should.equal(newServiceName);
		serviceCost.should.be.bignumber;
		assert(serviceCost.eq(newServiceCost));
		serviceEnabled.should.be.true;
		nextServiceId.should.be.bignumber;
		assert(nextServiceId.eq(ONE));

		// Record the starting balances of all parties.
		let firstPartyPot = await this.processor.getFirstPartyPot();
		let secondPartyPot = await this.processor.getSecondPartyPot();
		firstPartyPot.should.be.bignumber;
		assert(firstPartyPot.eq(ZERO));
		secondPartyPot.should.be.bignumber;
		assert(secondPartyPot.eq(ZERO));

		// Verify that a user may not purchase the service with insufficient funds.
		await this.processor.purchase(0, { from: player, value: ether(ZERO) }).should.be.rejectedWith(EVMRevert);
	});

	// The parties should each be able to withdraw their funds.
	it('Verify that the parties can each withdraw their funds.', async function () {

		// Verify the processor starts with no services.
		let nextServiceId = await this.processor.getNextServiceId();
		nextServiceId.should.be.bignumber;
		assert(nextServiceId.eq(ZERO));

		// Have the second party add a new service.
		let newServiceName = 'test';
		let newServiceCost = ether(ONE);
		await this.processor.addService(newServiceName, newServiceCost, { from: secondParty }).should.be.fulfilled;

		// Verify the service was added.
		let serviceName = await this.processor.getServiceName(0);
		let serviceCost = await this.processor.getServiceCost(0);
		let serviceEnabled = await this.processor.getServiceEnabled(0);
		nextServiceId = await this.processor.getNextServiceId();
		serviceName.should.equal(newServiceName);
		serviceCost.should.be.bignumber;
		assert(serviceCost.eq(newServiceCost));
		serviceEnabled.should.be.true;
		nextServiceId.should.be.bignumber;
		assert(nextServiceId.eq(ONE));

		// Record the starting balances of all parties.
		let firstPartyPot = await this.processor.getFirstPartyPot();
		let secondPartyPot = await this.processor.getSecondPartyPot();
		firstPartyPot.should.be.bignumber;
		assert(firstPartyPot.eq(ZERO));
		secondPartyPot.should.be.bignumber;
		assert(secondPartyPot.eq(ZERO));

		// Verify that a user may purchase the service.
		await this.processor.purchase(0, { from: player, value: ether(ONE) }).should.be.fulfilled;
		let purchases = await this.processor.getPurchases(player);
		purchases[0].should.be.bignumber;
		assert(purchases[0].eq(ZERO));
		firstPartyPot = await this.processor.getFirstPartyPot();
		secondPartyPot = await this.processor.getSecondPartyPot();
		firstPartyPot.should.be.bignumber;
		assert(firstPartyPot.eq(ether('0.5')));
		secondPartyPot.should.be.bignumber;
		assert(secondPartyPot.eq(ether('0.5')));

		// Verify that the first party may withdraw.
		await this.processor.withdrawFirst({ from: firstParty }).should.be.fulfilled;
		firstPartyPot = await this.processor.getFirstPartyPot();
		secondPartyPot = await this.processor.getSecondPartyPot();
		firstPartyPot.should.be.bignumber;
		assert(firstPartyPot.eq(ether('0')));
		secondPartyPot.should.be.bignumber;
		assert(secondPartyPot.eq(ether('0.5')));

		// Verify that the second party may withdraw.
		await this.processor.withdrawSecond({ from: secondParty }).should.be.fulfilled;
		firstPartyPot = await this.processor.getFirstPartyPot();
		secondPartyPot = await this.processor.getSecondPartyPot();
		firstPartyPot.should.be.bignumber;
		assert(firstPartyPot.eq(ether('0')));
		secondPartyPot.should.be.bignumber;
		assert(secondPartyPot.eq(ether('0')));
	});

	// The parties should not be able to withdraw from empty pots.
	it('Verify that the parties cannot withdraw from empty pots.', async function () {

		// Verify the processor starts with no services.
		let nextServiceId = await this.processor.getNextServiceId();
		nextServiceId.should.be.bignumber;
		assert(nextServiceId.eq(ZERO));

		// Have the second party add a new service.
		let newServiceName = 'test';
		let newServiceCost = ether(ONE);
		await this.processor.addService(newServiceName, newServiceCost, { from: secondParty }).should.be.fulfilled;

		// Verify the service was added.
		let serviceName = await this.processor.getServiceName(0);
		let serviceCost = await this.processor.getServiceCost(0);
		let serviceEnabled = await this.processor.getServiceEnabled(0);
		nextServiceId = await this.processor.getNextServiceId();
		serviceName.should.equal(newServiceName);
		serviceCost.should.be.bignumber;
		assert(serviceCost.eq(newServiceCost));
		serviceEnabled.should.be.true;
		nextServiceId.should.be.bignumber;
		assert(nextServiceId.eq(ONE));

		// Record the starting balances of all parties.
		let firstPartyPot = await this.processor.getFirstPartyPot();
		let secondPartyPot = await this.processor.getSecondPartyPot();
		firstPartyPot.should.be.bignumber;
		assert(firstPartyPot.eq(ZERO));
		secondPartyPot.should.be.bignumber;
		assert(secondPartyPot.eq(ZERO));

		// Verify that the first party may not withdraw.
		await this.processor.withdrawFirst({ from: firstParty }).should.be.rejectedWith(EVMRevert);

		// Verify that the second party may not withdraw.
		await this.processor.withdrawSecond({ from: secondParty }).should.be.rejectedWith(EVMRevert);
	});

	// Parties should be unable to withdraw from one another.
	it('Verify that the parties cannot withdraw from one another.', async function () {

		// Verify the processor starts with no services.
		let nextServiceId = await this.processor.getNextServiceId();
		nextServiceId.should.be.bignumber;
		assert(nextServiceId.eq(ZERO));

		// Have the second party add a new service.
		let newServiceName = 'test';
		let newServiceCost = ether(ONE);
		await this.processor.addService(newServiceName, newServiceCost, { from: secondParty }).should.be.fulfilled;

		// Verify the service was added.
		let serviceName = await this.processor.getServiceName(0);
		let serviceCost = await this.processor.getServiceCost(0);
		let serviceEnabled = await this.processor.getServiceEnabled(0);
		nextServiceId = await this.processor.getNextServiceId();
		serviceName.should.equal(newServiceName);
		serviceCost.should.be.bignumber;
		assert(serviceCost.eq(newServiceCost));
		serviceEnabled.should.be.true;
		nextServiceId.should.be.bignumber;
		assert(nextServiceId.eq(ONE));

		// Record the starting balances of all parties.
		let firstPartyPot = await this.processor.getFirstPartyPot();
		let secondPartyPot = await this.processor.getSecondPartyPot();
		firstPartyPot.should.be.bignumber;
		assert(firstPartyPot.eq(ZERO));
		secondPartyPot.should.be.bignumber;
		assert(secondPartyPot.eq(ZERO));

		// Verify that a user may purchase the service.
		await this.processor.purchase(0, { from: player, value: ether(ONE) }).should.be.fulfilled;
		let purchases = await this.processor.getPurchases(player);
		purchases[0].should.be.bignumber;
		assert(purchases[0].eq(ZERO));
		firstPartyPot = await this.processor.getFirstPartyPot();
		secondPartyPot = await this.processor.getSecondPartyPot();
		firstPartyPot.should.be.bignumber;
		assert(firstPartyPot.eq(ether('0.5')));
		secondPartyPot.should.be.bignumber;
		assert(secondPartyPot.eq(ether('0.5')));

		// Verify that the first party may not withdraw from the second.
		await this.processor.withdrawSecond({ from: firstParty }).should.be.rejectedWith(EVMRevert);

		// Verify that the second party may not withdraw from the first.
		await this.processor.withdrawFirst({ from: secondParty }).should.be.rejectedWith(EVMRevert);
	});

	// Non-parties should not be able to withdraw at all.
	it('Verify that standard users cannot withdraw funds.', async function () {

		// Verify the processor starts with no services.
		let nextServiceId = await this.processor.getNextServiceId();
		nextServiceId.should.be.bignumber;
		assert(nextServiceId.eq(ZERO));

		// Have the second party add a new service.
		let newServiceName = 'test';
		let newServiceCost = ether(ONE);
		await this.processor.addService(newServiceName, newServiceCost, { from: secondParty }).should.be.fulfilled;

		// Verify the service was added.
		let serviceName = await this.processor.getServiceName(0);
		let serviceCost = await this.processor.getServiceCost(0);
		let serviceEnabled = await this.processor.getServiceEnabled(0);
		nextServiceId = await this.processor.getNextServiceId();
		serviceName.should.equal(newServiceName);
		serviceCost.should.be.bignumber;
		assert(serviceCost.eq(newServiceCost));
		serviceEnabled.should.be.true;
		nextServiceId.should.be.bignumber;
		assert(nextServiceId.eq(ONE));

		// Record the starting balances of all parties.
		let firstPartyPot = await this.processor.getFirstPartyPot();
		let secondPartyPot = await this.processor.getSecondPartyPot();
		firstPartyPot.should.be.bignumber;
		assert(firstPartyPot.eq(ZERO));
		secondPartyPot.should.be.bignumber;
		assert(secondPartyPot.eq(ZERO));

		// Verify that a user may purchase the service.
		await this.processor.purchase(0, { from: player, value: ether(ONE) }).should.be.fulfilled;
		let purchases = await this.processor.getPurchases(player);
		purchases[0].should.be.bignumber;
		assert(purchases[0].eq(ZERO));
		firstPartyPot = await this.processor.getFirstPartyPot();
		secondPartyPot = await this.processor.getSecondPartyPot();
		firstPartyPot.should.be.bignumber;
		assert(firstPartyPot.eq(ether('0.5')));
		secondPartyPot.should.be.bignumber;
		assert(secondPartyPot.eq(ether('0.5')));

		// Verify that the first party may not be withdrawn from.
		await this.processor.withdrawFirst({ from: player }).should.be.rejectedWith(EVMRevert);

		// Verify that the second party may not be withdrawn from.
		await this.processor.withdrawSecond({ from: player }).should.be.rejectedWith(EVMRevert);
	});
});

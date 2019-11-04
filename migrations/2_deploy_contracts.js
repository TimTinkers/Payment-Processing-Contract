// Import the payment processor to deploy.
const PaymentProcessor = artifacts.require('PaymentProcessor');

// Setup the deployers.
module.exports = function (deployer, network, accounts) {

	// Choose a name, first party, and second party for the processor.
	const name = 'Dissolution';
	const firstParty = '0x0FD23b0327d7a182928d0BF8F453c0A471A4f3ed';
	const secondParty = '0x996dB5F1B6902ac637162427b11086A003d24405';

	// Deploy the payment processor.
	deployer.deploy(PaymentProcessor, name, firstParty, secondParty, { from: firstParty });
};

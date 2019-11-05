// Retrieve and parse environment variables.
const result = require('dotenv').config();
if (result.error) {
	console.error(result.parsed);
}

// Import the payment processor to deploy.
const PaymentProcessor = artifacts.require('PaymentProcessor');

// Choose a name, first party, and second party for the processor.
module.exports = function (deployer, network, accounts) {
	const name = process.env.PROCESSOR_NAME;
	const firstParty = process.env.FIRST_PARTY;
	const secondParty = process.env.SECOND_PARTY;

	// Deploy the payment processor.
	deployer.deploy(PaymentProcessor, name, firstParty, secondParty, { from: firstParty });
};

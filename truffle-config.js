// Retrieve and parse environment variables.
const result = require('dotenv').config();
if (result.error) {
	console.error(result.parsed);
}

// Imports.
require('babel-register');
require('babel-polyfill');

// Configure Truffle with available development networks.
module.exports = {
	networks: {
		ganache: {
			host: 'localhost',
			port: 8545,
			network_id: '*',
			gas: 4698712
		},
		develop: {
			host: 'localhost',
			port: 9545,
			network_id: '*',
			gas: 4698712
		},
		kovan: {
			provider: function () {
				return new HDWalletProvider(process.env.MNEMONIC, process.env.NODE_URL);
			},
			network_id: 42,
			gas: 4698712
		}
	},
	mocha: {
		timeout: 100000
	},
	compilers: {
		solc: {
			optimizer: {
				enabled: true,
				runs: 200
			}
		}
	}
};

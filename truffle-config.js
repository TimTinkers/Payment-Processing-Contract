require('babel-register');
require('babel-polyfill');

var HDWalletProvider = require('truffle-hdwallet-provider');
var configuration = require('./configuration');

module.exports = {
	networks: {
		ganache: {
			host: 'localhost',
			port: 8545,
			network_id: '*', // Match any network id
			gas: 4698712
		},
		develop: {
			host: 'localhost',
			port: 9545,
			network_id: '*', // Match any network id
			gas: 4698712
		},
		kovan: {
			provider: new HDWalletProvider(configuration.mnemonic,
				configuration.nodeURL),
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

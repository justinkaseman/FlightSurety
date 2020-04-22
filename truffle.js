var HDWalletProvider = require("truffle-hdwallet-provider");
var mnemonic =
  "apple elevator enjoy audit little market slam siren rookie slide alone great";

module.exports = {
  networks: {
    development: {
      provider: function () {
        return new HDWalletProvider(mnemonic, "http://127.0.0.1:8545/", 0, 50);
      },
      network_id: "*",
      gas: 4600000,
    },
  },
  compilers: {
    solc: {
      version: "^0.4.24",
    },
  },
};

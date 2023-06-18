require("@nomicfoundation/hardhat-toolbox");
require('@openzeppelin/hardhat-upgrades');
require("dotenv").config();
const ALCHEMY_API_KEY = "hC56GKbaNlJbs654N7OGeZ28romhAXBD";
const GOERLI_PRIVATE_KEY = "f3b1c3a588abe3697d41fa52baf7981f7c6807d1ed9d6aa8b159b2e150b79b42";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.17",
  networks: {
    localhost: {
      allowUnlimitedContractSize: true
    },
    hardhat: {
      allowUnlimitedContractSize: true
    },
    goerli: {
      url: `https://eth-goerli.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      accounts: [GOERLI_PRIVATE_KEY]
    }
  }
};

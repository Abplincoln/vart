require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const BOT_CHAIN_RPC_URL = process.env.BOT_CHAIN_RPC_URL || "https://rpc.bohr.life";
const BOT_CHAIN_MAINNET_RPC_URL = process.env.BOT_CHAIN_MAINNET_RPC_URL || "https://rpc.botchain.ai";
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const accounts = PRIVATE_KEY && !PRIVATE_KEY.startsWith("0x00000000")
  ? [PRIVATE_KEY]
  : [];

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {},
    botChainTestnet: {
      url: BOT_CHAIN_RPC_URL,
      chainId: 968,
      accounts: accounts,
    },
    botChainMainnet: {
      url: BOT_CHAIN_MAINNET_RPC_URL,
      chainId: 677,
      accounts: accounts,
    },
  },
};

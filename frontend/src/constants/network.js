export const BOT_CHAIN_TESTNET = {
  chainId: 968,
  chainIdHex: "0x3c8",
  chainName: "BOT Chain Bohr Testnet",
  websiteUrl: "https://botchain.ai/",
  rpcUrl: "https://rpc.bohr.life",
  explorerUrl: "https://scan.bohr.life",
  nativeCurrency: {
    name: "BOT",
    symbol: "BOT",
    decimals: 18,
  },
  contractAddress: "0x545B697201cB19DdFF7d68FBd60158dc454aaef7",
};

export const BOT_CHAIN_MAINNET = {
  chainId: 677,
  chainIdHex: "0x2a5",
  chainName: "BOT Chain Mainnet",
  websiteUrl: "https://botchain.ai/",
  rpcUrl: "https://rpc.botchain.ai",
  explorerUrl: "https://scan.botchain.ai",
  nativeCurrency: {
    name: "BOT",
    symbol: "BOT",
    decimals: 18,
  },
  contractAddress: "0xdCAA90a36Ba5B87E3079ED7ceb0E24aB86d18aD5",
};

// Supported networks mapping
export const SUPPORTED_NETWORKS = {
  677: BOT_CHAIN_MAINNET,
  968: BOT_CHAIN_TESTNET,
};

// Default active network: BOT Chain Mainnet
export const BOT_CHAIN = BOT_CHAIN_MAINNET;

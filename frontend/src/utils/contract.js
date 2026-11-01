import { ethers } from "ethers";
import { VART_ABI } from "../contracts/VartProfileAbi";
import {
  BOT_CHAIN,
  BOT_CHAIN_MAINNET,
  BOT_CHAIN_TESTNET,
  SUPPORTED_NETWORKS,
} from "../constants/network";

export { VART_ABI };

// Canonical deployed addresses
export const MAINNET_VART_CONTRACT_ADDRESS = "0xdCAA90a36Ba5B87E3079ED7ceb0E24aB86d18aD5";
export const TESTNET_VART_CONTRACT_ADDRESS = "0x545B697201cB19DdFF7d68FBd60158dc454aaef7";

// Default active deployed address (BOT Chain Mainnet)
export const DEPLOYED_VART_CONTRACT_ADDRESS = MAINNET_VART_CONTRACT_ADDRESS;

/**
 * Returns the network configuration matching a chain ID (defaults to active BOT_CHAIN).
 */
export function getNetworkForChainId(chainId) {
  if (chainId && SUPPORTED_NETWORKS[Number(chainId)]) {
    return SUPPORTED_NETWORKS[Number(chainId)];
  }
  return BOT_CHAIN;
}

/**
 * Get configured contract address from override, environment variable, or canonical network deployed address.
 * Optionally resolves according to the active chain ID.
 * Prevents any stale testnet address in environment variables from overriding the Mainnet contract.
 */
export function getContractAddress(overrideAddress = "", currentChainId = null) {
  // 1. Explicit user manual override input from UI
  if (overrideAddress && ethers.isAddress(overrideAddress)) {
    return overrideAddress;
  }

  // 2. If connected to Bohr Testnet, route to testnet contract address
  if (currentChainId && Number(currentChainId) === BOT_CHAIN_TESTNET.chainId) {
    return TESTNET_VART_CONTRACT_ADDRESS;
  }

  // 3. Environment variable configuration
  const envAddress = import.meta.env.VITE_VART_CONTRACT_ADDRESS || "";
  // Safety guard: Ensure a stale testnet address in env cannot accidentally override Mainnet
  if (
    envAddress &&
    ethers.isAddress(envAddress) &&
    envAddress !== ethers.ZeroAddress &&
    envAddress.toLowerCase() !== TESTNET_VART_CONTRACT_ADDRESS.toLowerCase()
  ) {
    return envAddress;
  }

  // 4. Default to canonical BOT Chain Mainnet contract address
  return MAINNET_VART_CONTRACT_ADDRESS;
}

/**
 * Check whether a contract address is configured.
 */
export function isContractConfigured(overrideAddress = "", currentChainId = null) {
  return Boolean(getContractAddress(overrideAddress, currentChainId));
}

/**
 * Returns a read-only provider for the target network (defaults to active BOT_CHAIN).
 */
export function getReadOnlyProvider(network = BOT_CHAIN) {
  return new ethers.JsonRpcProvider(network.rpcUrl, {
    name: network.chainName,
    chainId: network.chainId,
  });
}

/**
 * Returns a read-only instance of the VartProfile contract.
 */
export function getReadOnlyContract(overrideAddress = "", currentChainId = null) {
  const targetNetwork = getNetworkForChainId(currentChainId);
  const address = getContractAddress(overrideAddress, targetNetwork.chainId);
  if (!address) return null;
  const provider = getReadOnlyProvider(targetNetwork);
  return new ethers.Contract(address, VART_ABI, provider);
}

/**
 * Returns a signer-connected instance of the VartProfile contract.
 */
export async function getSignerContract(overrideAddress = "", currentChainId = null) {
  if (!window.ethereum) {
    throw new Error("No Web3 wallet detected. Please install MetaMask.");
  }
  const browserProvider = new ethers.BrowserProvider(window.ethereum);
  const network = await browserProvider.getNetwork();
  const connectedChainId = Number(network.chainId);

  const activeChainId = currentChainId || connectedChainId;
  const address = getContractAddress(overrideAddress, activeChainId);
  if (!address) {
    throw new Error("Vart contract address is not configured.");
  }

  const signer = await browserProvider.getSigner();
  return new ethers.Contract(address, VART_ABI, signer);
}

/**
 * Request MetaMask to switch to or add the target BOT Chain network (defaults to Mainnet).
 */
export async function switchOrAddBotChain(targetNetwork = BOT_CHAIN) {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed.");
  }
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: targetNetwork.chainIdHex }],
    });
    return true;
  } catch (switchError) {
    // Error code 4902 indicates that the chain has not been added to MetaMask.
    const isChainNotAdded =
      switchError.code === 4902 ||
      switchError?.info?.error?.code === 4902 ||
      switchError?.data?.originalError?.code === 4902 ||
      switchError?.message?.includes("4902") ||
      switchError?.message?.toLowerCase().includes("unrecognized chain");

    if (isChainNotAdded) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: targetNetwork.chainIdHex,
            chainName: targetNetwork.chainName,
            nativeCurrency: targetNetwork.nativeCurrency,
            rpcUrls: [targetNetwork.rpcUrl],
            blockExplorerUrls: [targetNetwork.explorerUrl],
          },
        ],
      });
      return true;
    }
    throw switchError;
  }
}

/**
 * Parses and formats smart contract errors into clear human-readable messages.
 */
export function parseContractError(error) {
  if (!error) return "An unknown error occurred.";

  // User rejected transaction in wallet
  if (
    error.code === "ACTION_REJECTED" ||
    error.code === 4001 ||
    error?.info?.error?.code === 4001 ||
    error?.error?.code === 4001 ||
    error?.message?.toLowerCase().includes("user rejected") ||
    error?.message?.toLowerCase().includes("user denied")
  ) {
    return "Transaction signature was cancelled in your wallet.";
  }

  // Attempt to parse custom error using contract interface
  const iface = new ethers.Interface(VART_ABI);
  let parsedError = null;

  try {
    const errorData =
      error.data ||
      error?.info?.error?.data ||
      error?.error?.data ||
      error?.revert?.data ||
      error?.error?.error?.data;
    if (errorData && typeof errorData === "string" && errorData.startsWith("0x")) {
      parsedError = iface.parseError(errorData);
    }
  } catch {
    // If interface parsing fails, continue to message inspection
  }

  // Fallback: check if error name appears in the message string
  const rawMsg = error.reason || error.shortMessage || error.message || "";
  if (!parsedError) {
    for (const errName of [
      "UsernameAlreadyTaken",
      "ProfileAlreadyExists",
      "ProfileDoesNotExist",
      "Unauthorized",
      "InvalidUsernameLength",
      "InvalidUsernameCharacter",
      "InvalidAvatarStyle",
      "InvalidSkinTone",
      "InvalidHairstyle",
      "InvalidBackground",
    ]) {
      if (rawMsg.includes(errName)) {
        parsedError = { name: errName, args: [] };
        break;
      }
    }
  }

  if (parsedError) {
    switch (parsedError.name) {
      case "UsernameAlreadyTaken":
        return parsedError.args[0]
          ? `The username "${parsedError.args[0]}" is already taken. Please choose another username.`
          : "That username is already taken. Please choose another username.";
      case "ProfileAlreadyExists":
        return `This wallet address already has a registered identity profile.`;
      case "ProfileDoesNotExist":
        return `No profile was found for this wallet address.`;
      case "Unauthorized":
        return `Unauthorized: only the profile owner can modify this profile.`;
      case "InvalidUsernameLength":
        return parsedError.args[0]
          ? `Username length (${parsedError.args[0]} chars) is invalid. Must be between 3 and 20 characters.`
          : "Username length must be between 3 and 20 characters.";
      case "InvalidUsernameCharacter":
        return `Username contains invalid characters. Use only lowercase letters (a-z), numbers (0-9), and underscores (_).`;
      case "InvalidAvatarStyle":
        return `Avatar style ID must be between 0 and 5.`;
      case "InvalidSkinTone":
        return `Skin tone ID must be between 0 and 5.`;
      case "InvalidHairstyle":
        return `Hairstyle ID must be between 0 and 7.`;
      case "InvalidBackground":
        return `Background ID must be between 0 and 7.`;
      default:
        return `Smart Contract Revert: ${parsedError.name}`;
    }
  }

  // Common network or RPC messages
  if (rawMsg.includes("insufficient funds")) {
    return `Insufficient BOT token balance to pay gas fees on ${BOT_CHAIN.chainName}.`;
  }
  if (rawMsg.includes("network") || rawMsg.includes("fetch")) {
    return `Network error connecting to BOT Chain RPC (${BOT_CHAIN.rpcUrl}). Please check your connection.`;
  }

  return rawMsg || "Transaction failed. Please check the inputs and your wallet balance.";
}

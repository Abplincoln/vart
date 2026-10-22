import { ethers } from "ethers";
import VartProfileArtifact from "../../../artifacts/contracts/VartProfile.sol/VartProfile.json";
import { BOT_CHAIN } from "../constants/network";

export const VART_ABI = VartProfileArtifact.abi;
export const DEPLOYED_VART_CONTRACT_ADDRESS = "0x545B697201cB19DdFF7d68FBd60158dc454aaef7";

/**
 * Get configured contract address from environment variable, fallback override, or canonical deployed address.
 */
export function getContractAddress(overrideAddress = "") {
  if (overrideAddress && ethers.isAddress(overrideAddress)) {
    return overrideAddress;
  }
  const envAddress = import.meta.env.VITE_VART_CONTRACT_ADDRESS || "";
  if (envAddress && ethers.isAddress(envAddress) && envAddress !== ethers.ZeroAddress) {
    return envAddress;
  }
  return DEPLOYED_VART_CONTRACT_ADDRESS;
}

/**
 * Check whether a contract address is configured.
 */
export function isContractConfigured(overrideAddress = "") {
  return Boolean(getContractAddress(overrideAddress));
}

/**
 * Returns a read-only provider for BOT Chain Bohr Testnet.
 */
export function getReadOnlyProvider() {
  return new ethers.JsonRpcProvider(BOT_CHAIN.rpcUrl, {
    name: BOT_CHAIN.chainName,
    chainId: BOT_CHAIN.chainId,
  });
}

/**
 * Returns a read-only instance of the VartProfile contract.
 */
export function getReadOnlyContract(overrideAddress = "") {
  const address = getContractAddress(overrideAddress);
  if (!address) return null;
  const provider = getReadOnlyProvider();
  return new ethers.Contract(address, VART_ABI, provider);
}

/**
 * Returns a signer-connected instance of the VartProfile contract.
 */
export async function getSignerContract(overrideAddress = "") {
  const address = getContractAddress(overrideAddress);
  if (!address) {
    throw new Error("Vart contract address is not configured.");
  }
  if (!window.ethereum) {
    throw new Error("No Web3 wallet detected. Please install MetaMask.");
  }
  const browserProvider = new ethers.BrowserProvider(window.ethereum);
  const signer = await browserProvider.getSigner();
  return new ethers.Contract(address, VART_ABI, signer);
}

/**
 * Request MetaMask to switch to or add the BOT Chain Bohr Testnet.
 */
export async function switchOrAddBotChain() {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed.");
  }
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: BOT_CHAIN.chainIdHex }],
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
            chainId: BOT_CHAIN.chainIdHex,
            chainName: BOT_CHAIN.chainName,
            nativeCurrency: BOT_CHAIN.nativeCurrency,
            rpcUrls: [BOT_CHAIN.rpcUrl],
            blockExplorerUrls: [BOT_CHAIN.explorerUrl],
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
    return "Insufficient BOT token balance to pay gas fees on BOT Chain Bohr Testnet.";
  }
  if (rawMsg.includes("network") || rawMsg.includes("fetch")) {
    return "Network error connecting to BOT Chain RPC (https://rpc.bohr.life). Please check your connection.";
  }

  return rawMsg || "Transaction failed. Please check the inputs and your wallet balance.";
}

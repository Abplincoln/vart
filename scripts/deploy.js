const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  const expectedNetworkName = "botChainTestnet";
  const expectedChainId = 968n;

  // 1. Safety Check: Verify target network name is strictly botChainTestnet
  if (hre.network.name !== expectedNetworkName) {
    console.error(`\n[SAFETY ABORT] Invalid target network: "${hre.network.name}".`);
    console.error(`This deployment script is strictly restricted to "${expectedNetworkName}".`);
    console.error(`Execute with: npx hardhat run scripts/deploy.js --network ${expectedNetworkName}\n`);
    process.exitCode = 1;
    return;
  }

  // 2. Safety Check: Verify live on-chain chain ID is strictly 968
  const network = await ethers.provider.getNetwork();
  if (network.chainId !== expectedChainId) {
    console.error(
      `\n[SAFETY ABORT] Connected chain ID ${network.chainId.toString()} does not match target BOT Chain Bohr Testnet (${expectedChainId.toString()}).`
    );
    process.exitCode = 1;
    return;
  }

  // 3. Safety Check: Verify deployer signer availability from root .env
  const signers = await ethers.getSigners();
  if (!signers || signers.length === 0) {
    console.error(`\n[SAFETY ABORT] No deployer account configured.`);
    console.error(`Please set a valid PRIVATE_KEY in the root .env file.`);
    process.exitCode = 1;
    return;
  }

  const deployer = signers[0];
  const deployerAddress = await deployer.getAddress();

  // 4. Safety Check: Dynamically estimate deployment gas and verify deployer BOT balance
  const balance = await ethers.provider.getBalance(deployerAddress);

  const VartProfile = await ethers.getContractFactory("VartProfile");
  const deployTxReq = await VartProfile.getDeployTransaction();

  let estimatedGas = 900000n; // Conservative baseline (~896,486 units for VartProfile)
  try {
    estimatedGas = await ethers.provider.estimateGas(deployTxReq);
  } catch {
    // If the node requires funds to simulate from an address, keep baseline
  }

  const feeData = await ethers.provider.getFeeData();
  const gasPrice = feeData.gasPrice || feeData.maxFeePerGas || ethers.parseUnits("20", "gwei");
  const estimatedCost = estimatedGas * gasPrice;
  // Apply a 20% safety buffer to accommodate block gas price shifts and receipt confirmations
  const minRequiredBalance = (estimatedCost * 120n) / 100n;

  console.log("----------------------------------------------------------------");
  console.log("Vart V1 Contract Deployment Preparation");
  console.log("----------------------------------------------------------------");
  console.log(`Target Network : ${hre.network.name}`);
  console.log(`Chain ID       : ${network.chainId.toString()}`);
  console.log(`RPC Endpoint   : ${hre.network.config.url || "https://rpc.bohr.life"}`);
  console.log(`Deployer       : ${deployerAddress}`);
  console.log(`Balance        : ${ethers.formatEther(balance)} BOT`);
  console.log(`Estimated Gas  : ${estimatedGas.toString()} units @ ${ethers.formatUnits(gasPrice, "gwei")} gwei`);
  console.log(`Estimated Cost : ${ethers.formatEther(estimatedCost)} BOT (~${ethers.formatEther(minRequiredBalance)} BOT with 20% margin)`);
  console.log("----------------------------------------------------------------");

  if (balance < minRequiredBalance) {
    console.error(`\n[SAFETY ABORT] Deployer account has insufficient BOT tokens for gas.`);
    console.error(`Current balance  : ${ethers.formatEther(balance)} BOT`);
    console.error(`Required balance : >= ${ethers.formatEther(minRequiredBalance)} BOT (estimated cost + 20% buffer)`);
    console.error(`\nHow to fund your deployer wallet:`);
    console.error(`1. Open the official BOT Chain faucet: https://faucet.botchain.ai/basic`);
    console.error(`2. Paste your deployer wallet address: ${deployerAddress}`);
    console.error(`3. Request testnet BOT, wait for transaction confirmation, and re-run deployment.\n`);
    process.exitCode = 1;
    return;
  }

  // 5. Execute Deployment
  console.log("Deploying VartProfile...");
  const vartProfile = await VartProfile.deploy();

  console.log("Waiting for block confirmation on BOT Chain Bohr Testnet...");
  await vartProfile.waitForDeployment();

  const contractAddress = await vartProfile.getAddress();
  const deploymentTx = vartProfile.deploymentTransaction();

  console.log("\n================================================================");
  console.log("VartProfile Successfully Deployed!");
  console.log("================================================================");
  console.log(`Contract Address  : ${contractAddress}`);
  console.log(`Transaction Hash  : ${deploymentTx ? deploymentTx.hash : "N/A"}`);
  console.log(`Explorer URL      : https://scan.bohr.life/address/${contractAddress}`);
  console.log("================================================================\n");
  console.log("Next Step: Update frontend/.env with the deployed address:");
  console.log(`VITE_VART_CONTRACT_ADDRESS=${contractAddress}\n`);
}

main().catch((error) => {
  console.error("\nDeployment terminated with error:", error.message || error);
  process.exitCode = 1;
});

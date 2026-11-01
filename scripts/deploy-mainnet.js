const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  const expectedNetworkName = "botChainMainnet";
  const expectedChainId = 677n;
  const explorerBaseUrl = "https://scan.botchain.ai";
  const rpcDefaultUrl = "https://rpc.botchain.ai";

  // 1. Safety Guard: Enforce strict target network name
  if (hre.network.name !== expectedNetworkName) {
    console.error(`\n[SAFETY ABORT] Invalid target network: "${hre.network.name}".`);
    console.error(`This deployment script is strictly restricted to "${expectedNetworkName}" (BOT Chain Mainnet).`);
    console.error(`Refusing to deploy on "${hre.network.name}".`);
    console.error(`Execute with: npx hardhat run scripts/deploy-mainnet.js --network ${expectedNetworkName}\n`);
    process.exitCode = 1;
    return;
  }

  // 2. Safety Guard: Enforce strict live on-chain chain ID (677)
  const network = await ethers.provider.getNetwork();
  if (network.chainId !== expectedChainId) {
    console.error(
      `\n[SAFETY ABORT] Connected chain ID ${network.chainId.toString()} does not match target BOT Chain Mainnet (${expectedChainId.toString()}).`
    );
    console.error(`Refusing to broadcast deployment on chain ID ${network.chainId.toString()}.\n`);
    process.exitCode = 1;
    return;
  }

  // 3. Safety Guard: Require deployer signer from PRIVATE_KEY without printing or exposing secrets
  const signers = await ethers.getSigners();
  if (!signers || signers.length === 0) {
    console.error(`\n[SAFETY ABORT] No deployer account configured.`);
    console.error(`Please ensure a valid PRIVATE_KEY is set in your local .env file.`);
    console.error(`(Do not commit .env or share your private key).\n`);
    process.exitCode = 1;
    return;
  }

  const deployer = signers[0];
  const deployerAddress = await deployer.getAddress();

  // 4. Gas Estimation & Mainnet Balance Check
  const balance = await ethers.provider.getBalance(deployerAddress);

  const VartProfile = await ethers.getContractFactory("VartProfile");
  const deployTxReq = await VartProfile.getDeployTransaction();

  let estimatedGas = 900000n; // Conservative baseline (~896,486 gas units for VartProfile)
  try {
    estimatedGas = await ethers.provider.estimateGas(deployTxReq);
  } catch (err) {
    console.warn(`[Notice] Dynamic RPC gas estimation unavailable; using conservative baseline (${estimatedGas.toString()} gas units).`);
  }

  const feeData = await ethers.provider.getFeeData();
  const gasPrice = feeData.gasPrice || feeData.maxFeePerGas || ethers.parseUnits("20", "gwei");
  const estimatedCost = estimatedGas * gasPrice;

  // Apply a 20% safety margin to account for gas price variance and receipt confirmation
  const minRequiredBalance = (estimatedCost * 120n) / 100n;

  console.log("----------------------------------------------------------------");
  console.log("BOT Chain Mainnet (Chain ID 677) Deployment Preparation");
  console.log("----------------------------------------------------------------");
  console.log(`Target Network : BOT Chain Mainnet (${hre.network.name})`);
  console.log(`Chain ID       : ${network.chainId.toString()}`);
  console.log(`RPC Endpoint   : ${hre.network.config.url || rpcDefaultUrl}`);
  console.log(`Block Explorer : ${explorerBaseUrl}`);
  console.log(`Deployer       : ${deployerAddress}`);
  console.log(`Deployer Bal   : ${ethers.formatEther(balance)} BOT`);
  console.log(`Estimated Gas  : ${estimatedGas.toString()} units @ ${ethers.formatUnits(gasPrice, "gwei")} gwei`);
  console.log(`Estimated Cost : ${ethers.formatEther(estimatedCost)} BOT (~${ethers.formatEther(minRequiredBalance)} BOT required with 20% safety margin)`);
  console.log("----------------------------------------------------------------");

  if (balance < minRequiredBalance) {
    console.error(`\n[SAFETY ABORT] Deployer account has insufficient BOT tokens for gas on BOT Chain Mainnet.`);
    console.error(`Current balance  : ${ethers.formatEther(balance)} BOT`);
    console.error(`Required balance : >= ${ethers.formatEther(minRequiredBalance)} BOT (estimated cost + 20% safety margin)`);
    console.error(`\nPlease fund your mainnet deployer address (${deployerAddress}) with BOT before deploying.\n`);
    process.exitCode = 1;
    return;
  }

  // Preflight check mode support
  if (process.env.DRY_RUN === "true" || process.env.PREFLIGHT === "true") {
    console.log("\n[DRY RUN / PREFLIGHT] Preflight verification completed successfully.");
    console.log("No transactions were broadcast to BOT Chain Mainnet.");
    return;
  }

  // 5. Broadcast Deployment to BOT Chain Mainnet
  console.log("\nDeploying VartProfile smart contract to BOT Chain Mainnet...");
  const vartProfile = await VartProfile.deploy();

  console.log("Waiting for block confirmation on BOT Chain Mainnet...");
  await vartProfile.waitForDeployment();

  const contractAddress = await vartProfile.getAddress();
  const deploymentTx = vartProfile.deploymentTransaction();
  const receipt = deploymentTx ? await deploymentTx.wait() : null;

  console.log("\n================================================================");
  console.log("VartProfile Successfully Deployed to BOT Chain Mainnet!");
  console.log("================================================================");
  console.log(`Contract Address  : ${contractAddress}`);
  console.log(`Transaction Hash  : ${deploymentTx ? deploymentTx.hash : "N/A"}`);
  console.log(`Deployer Address  : ${deployerAddress}`);
  if (receipt) {
    console.log(`Block Number      : ${receipt.blockNumber.toString()}`);
    console.log(`Gas Used          : ${receipt.gasUsed.toString()} units`);
  }
  console.log(`Explorer Link     : ${explorerBaseUrl}/address/${contractAddress}`);
  if (deploymentTx && deploymentTx.hash) {
    console.log(`Tx Explorer Link  : ${explorerBaseUrl}/tx/${deploymentTx.hash}`);
  }
  console.log("================================================================\n");
}

main().catch((error) => {
  console.error("\nDeployment terminated with error:", error.message || error);
  process.exitCode = 1;
});

const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  const expectedNetworkName = "botChainMainnet";
  const expectedChainId = 677n;
  const explorerBaseUrl = "https://scan.botchain.ai";
  const rpcUrl = hre.network.config.url || "https://rpc.botchain.ai";

  console.log("================================================================");
  console.log("       BOT CHAIN MAINNET PREFLIGHT VERIFICATION (NO-OP)         ");
  console.log("================================================================\n");

  // 1. Verify Target Network
  console.log("1. Checking Hardhat Target Network...");
  if (hre.network.name !== expectedNetworkName) {
    console.error(`   [FAIL] Selected network is "${hre.network.name}". Expected "${expectedNetworkName}".`);
    console.error(`   Run with: npx hardhat run scripts/preflight-mainnet.js --network ${expectedNetworkName}\n`);
    process.exitCode = 1;
    return;
  }
  console.log(`   [PASS] Target network: ${hre.network.name}`);

  // 2. Verify RPC Connectivity & Chain ID
  console.log("2. Checking Live On-Chain Connection & Chain ID...");
  const startTime = Date.now();
  let network;
  let blockNumber;
  try {
    network = await ethers.provider.getNetwork();
    blockNumber = await ethers.provider.getBlockNumber();
  } catch (err) {
    console.error(`   [FAIL] Could not connect to RPC endpoint: ${rpcUrl}`);
    console.error(`   Error details: ${err.message || err}\n`);
    process.exitCode = 1;
    return;
  }
  const latency = Date.now() - startTime;

  if (network.chainId !== expectedChainId) {
    console.error(
      `   [FAIL] Connected chain ID ${network.chainId.toString()} does not match official BOT Chain Mainnet (${expectedChainId.toString()}).`
    );
    process.exitCode = 1;
    return;
  }
  console.log(`   [PASS] Connected to ${rpcUrl} (latency: ${latency}ms)`);
  console.log(`   [PASS] Chain ID: ${network.chainId.toString()} (official BOT Chain Mainnet)`);
  console.log(`   [PASS] Latest Block Number: ${blockNumber}`);

  // 3. Verify Deployer Signer & Balance
  console.log("3. Checking Deployer Configuration & Balance...");
  const signers = await ethers.getSigners();
  if (!signers || signers.length === 0) {
    console.error(`   [FAIL] No deployer account loaded.`);
    console.error(`   Please configure PRIVATE_KEY in the root .env file.\n`);
    process.exitCode = 1;
    return;
  }

  const deployer = signers[0];
  const deployerAddress = await deployer.getAddress();
  const balance = await ethers.provider.getBalance(deployerAddress);

  console.log(`   [PASS] Deployer Address: ${deployerAddress}`);
  console.log(`   [INFO] Deployer Balance: ${ethers.formatEther(balance)} BOT`);

  // 4. Contract Factory & Deployment Simulation
  console.log("4. Simulating Deployment Transaction & Gas Estimation...");
  const VartProfile = await ethers.getContractFactory("VartProfile");
  const deployTxReq = await VartProfile.getDeployTransaction();

  let estimatedGas = 900000n;
  let dynamicGasSuccess = false;
  try {
    estimatedGas = await ethers.provider.estimateGas(deployTxReq);
    dynamicGasSuccess = true;
  } catch (err) {
    console.warn(`   [NOTE] Dynamic RPC gas estimation failed (${err.shortMessage || err.message || "node simulation limit"}).`);
    console.warn(`   Using conservative baseline of ${estimatedGas.toString()} gas units.`);
  }

  const feeData = await ethers.provider.getFeeData();
  const gasPrice = feeData.gasPrice || feeData.maxFeePerGas || ethers.parseUnits("20", "gwei");
  const estimatedCost = estimatedGas * gasPrice;
  const minRequiredBalance = (estimatedCost * 120n) / 100n; // 20% safety margin

  console.log(`   [PASS] Gas Estimation: ${estimatedGas.toString()} units (${dynamicGasSuccess ? "dynamic RPC estimate" : "conservative baseline"})`);
  console.log(`   [PASS] Gas Price: ${ethers.formatUnits(gasPrice, "gwei")} gwei`);
  console.log(`   [PASS] Estimated Deployment Cost: ${ethers.formatEther(estimatedCost)} BOT`);
  console.log(`   [PASS] Minimum Recommended Balance (with 20% margin): ${ethers.formatEther(minRequiredBalance)} BOT`);

  // 5. Readiness Summary
  console.log("\n================================================================");
  console.log("                      PREFLIGHT SUMMARY                         ");
  console.log("================================================================");
  console.log(`Network          : BOT Chain Mainnet`);
  console.log(`Chain ID         : ${network.chainId.toString()}`);
  console.log(`RPC Endpoint     : ${rpcUrl}`);
  console.log(`Explorer         : ${explorerBaseUrl}`);
  console.log(`Deployer Address : ${deployerAddress}`);
  console.log(`Current Balance  : ${ethers.formatEther(balance)} BOT`);
  console.log(`Estimated Cost   : ${ethers.formatEther(estimatedCost)} BOT`);
  console.log(`Recommended Bal  : >= ${ethers.formatEther(minRequiredBalance)} BOT`);
  console.log("----------------------------------------------------------------");

  if (balance >= minRequiredBalance) {
    console.log("STATUS: [READY FOR DEPLOYMENT]");
    console.log("The deployer account holds sufficient BOT tokens for mainnet deployment.");
  } else {
    console.log("STATUS: [INSUFFICIENT BALANCE]");
    console.log(`The deployer account holds ${ethers.formatEther(balance)} BOT, which is less than the recommended ${ethers.formatEther(minRequiredBalance)} BOT.`);
    console.log(`Please transfer at least ${ethers.formatEther(minRequiredBalance - balance)} BOT to ${deployerAddress} before deploying.`);
  }
  console.log("================================================================\n");
}

main().catch((error) => {
  console.error("\nPreflight check failed with error:", error.message || error);
  process.exitCode = 1;
});

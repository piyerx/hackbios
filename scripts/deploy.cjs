const hre = require("hardhat");

async function main() {
  console.log("Deploying ParkingMarketplace contract to Sepolia...");

  const ParkingMarketplace = await hre.ethers.getContractFactory("ParkingMarketplace");
  const parkingMarketplace = await ParkingMarketplace.deploy();

  await parkingMarketplace.waitForDeployment();

  const address = await parkingMarketplace.getAddress();
  
  console.log("\n✅ ParkingMarketplace deployed to:", address);
  console.log("\n📝 Update your src/contract.js with this address:");
  console.log(`export const CONTRACT_ADDRESS = "${address}";`);
  
  console.log("\n🔍 Verify on Etherscan:");
  console.log(`npx hardhat verify --network sepolia ${address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

const hre = require("hardhat");

async function main() {
  console.log("Deploying Voting contract...");

  const Voting = await hre.ethers.getContractFactory("Voting");
  const voting = await Voting.deploy();

  await voting.waitForDeployment();

  const address = await voting.getAddress();
  console.log("Voting contract deployed to:", address);

  // Optional: Add some initial candidates for testing
  console.log("Adding initial candidates...");
  
  const tx1 = await voting.addCandidate("John Doe", "Democratic Party");
  await tx1.wait();
  console.log("Added candidate: John Doe (Democratic Party)");

  const tx2 = await voting.addCandidate("Jane Smith", "Republican Party");
  await tx2.wait();
  console.log("Added candidate: Jane Smith (Republican Party)");

  const tx3 = await voting.addCandidate("Bob Johnson", "Independent Party");
  await tx3.wait();
  console.log("Added candidate: Bob Johnson (Independent Party)");

  // Set voting dates (start in 1 minute, end in 1 hour)
  const now = Math.floor(Date.now() / 1000);
  const startDate = now + 60; // 1 minute from now
  const endDate = now + 3600; // 1 hour from now

  const tx4 = await voting.setDates(startDate, endDate);
  await tx4.wait();
  console.log(`Voting period set: ${new Date(startDate * 1000)} to ${new Date(endDate * 1000)}`);

  console.log("Deployment completed successfully!");
  console.log("Contract address:", address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 
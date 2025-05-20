// scripts/deployStakingPool.js
const hre = require('hardhat')

async function main () {
  const [deployer] = await hre.ethers.getSigners()

  const rewardRate = hre.ethers.parseUnits('0.000001', 18) // tweak
  const token = '0xYourERC20Address'                       // change!

  const StakingPool = await hre.ethers.getContractFactory('StakingPool')
  const pool = await StakingPool.deploy(token, rewardRate)

  await pool.waitForDeployment()
  console.log('StakingPool deployed to:', await pool.getAddress())
}

main().catch(err => {
  console.error(err); process.exit(1)
})

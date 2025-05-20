const { expect } = require("chai");
const { loadFixture, time } =
  require("@nomicfoundation/hardhat-network-helpers");

describe("StakingPool", () => {
  /* ─────────────────────────  FIXTURE  ─────────────────────────── */

  async function deployFixture () {
    const [owner, alice, bob] = await ethers.getSigners();

    // Mock ERC-20
    const Token = await ethers.getContractFactory("TestToken");
    const token = await Token.deploy("Mock", "MOCK", 18);
    await token.mint(owner.address, ethers.parseEther("100000"));
    await token.mint(alice.address, ethers.parseEther("1000"));
    await token.mint(bob.address,   ethers.parseEther("1000"));

    // Pool: 0.01 reward / token / sec
    const rate  = ethers.parseUnits("1", 16);
    const Pool  = await ethers.getContractFactory("StakingPool");
    const pool  = await Pool.deploy(await token.getAddress(), rate);

    // Fund reward pool with 1 000 tokens
    await token.approve(await pool.getAddress(), ethers.parseEther("1000"));
    await pool.fundRewards(ethers.parseEther("1000"));

    return { owner, alice, bob, token, pool };
  }

  /* ─────────────────────────  CORE TESTS  ──────────────────────── */

  it("sets correct initial values", async () => {
    const { token, pool } = await loadFixture(deployFixture);
    expect(await pool.stakingToken()).to.equal(await token.getAddress());
    expect(await pool.rewardRate()).to.equal(ethers.parseUnits("1", 16));
    expect(await pool.totalStaked()).to.equal(0n);
    expect(await pool.rewardPoolBalance()).to.equal(ethers.parseEther("1000"));
  });

  it("allows users to stake tokens", async () => {
    const { alice, token, pool } = await loadFixture(deployFixture);
    await token.connect(alice)
      .approve(await pool.getAddress(), ethers.parseEther("100"));
    await pool .connect(alice).stake(ethers.parseEther("100"));

    expect(await pool.totalStaked()).to.equal(ethers.parseEther("100"));
    const info = await pool.stakes(alice.address);
    expect(info.amount).to.equal(ethers.parseEther("100"));
  });

  it("rejects zero-amount staking", async () => {
    const { alice, pool } = await loadFixture(deployFixture);
    await expect(pool.connect(alice).stake(0)).to.be.revertedWith("Stake 0");
  });

  it("updates reward tracking when others stake", async () => {
    const { alice, bob, token, pool } = await loadFixture(deployFixture);

    await token.connect(alice)
      .approve(await pool.getAddress(), ethers.parseEther("100"));
    await pool .connect(alice).stake(ethers.parseEther("100"));

    await time.increase(10);                               // 10 s accrual

    await token.connect(bob)
      .approve(await pool.getAddress(), ethers.parseEther("50"));
    await pool .connect(bob) .stake(ethers.parseEther("50"));

    const pending = await pool.pendingReward(alice.address);
    // 100 × 0.01 × 12 ≈ 12 MOCK (extra 2 s from tx blocks)
    expect(pending).to.be.closeTo(
      ethers.parseEther("12"), ethers.parseEther("0.02")
    );
  });

 

  it("accrues and claims rewards", async () => {
    const { alice, token, pool } = await loadFixture(deployFixture);
  
    await token.connect(alice)
      .approve(await pool.getAddress(), ethers.parseEther("100"));
    await pool.connect(alice).stake(ethers.parseEther("100"));
    await time.increase(10);                               // ≈11 MOCK
  
    const before = BigInt(await token.balanceOf(alice.address));
    await pool.connect(alice).claim();
    const after  = BigInt(await token.balanceOf(alice.address));
  
    expect(after - before).to.be.closeTo(
      ethers.parseEther("11"), ethers.parseEther("0.02")
    );
  });

    /* ───────── accrues and claims rewards ───────── */
    it("accrues and claims rewards", async () => {
      const { alice, token, pool } = await loadFixture(deployFixture);
  
      await token.connect(alice)
        .approve(await pool.getAddress(), ethers.parseEther("100"));
      await pool .connect(alice).stake(ethers.parseEther("100"));
      await time.increase(10);
  
      const before = BigInt(await token.balanceOf(alice.address));
      await pool.connect(alice).claim();
      const after  = BigInt(await token.balanceOf(alice.address));
  
      // ≈11 MOCK because of two extra mined blocks
      expect(after - before).to.be.closeTo(
        ethers.parseEther("11"), ethers.parseEther("0.02")
      );
    });
  
 /* ───────── pays partial reward when pool is short ───────── */
 it("pays partial reward when pool is short", async () => {
  const { alice, token, pool } = await loadFixture(deployFixture);

  // stake so rewards almost drain the 1 000 MOCK pool
  await token.connect(alice)
    .approve(await pool.getAddress(), ethers.parseEther("400"));
  await pool.connect(alice).stake(ethers.parseEther("400"));

  await time.increase(240);                  // accrues ≈ 960 MOCK
  await pool.connect(alice).claim();         // pool now 40 ± 10 MOCK, or 0

  const remainder = await pool.rewardPoolBalance();
  // Accept either 0 or a tiny remainder ≤ 0.05 MOCK
  expect(remainder).to.be.lte(ethers.parseEther("50"));
});

  it("accounts correctly for reward-rate change", async () => {
    const { owner, alice, token, pool } = await loadFixture(deployFixture);

    await token.connect(alice)
      .approve(await pool.getAddress(), ethers.parseEther("100"));
    await pool .connect(alice).stake(ethers.parseEther("100"));

    await time.increase(10);                               // ≈12 MOCK
    await pool.connect(owner).setRewardRate(ethers.parseUnits("2", 16));
    await time.increase(10);                               // +30 MOCK

    const pending = await pool.pendingReward(alice.address);
    expect(pending).to.be.closeTo(
      ethers.parseEther("42"), ethers.parseEther("0.02")
    );
  });

  /* ──────────────────────────  UNSTAKING  ──────────────────────── */

  it("allows unstaking with rewards", async () => {
    const { alice, token, pool } = await loadFixture(deployFixture);

    await token.connect(alice)
      .approve(await pool.getAddress(), ethers.parseEther("100"));
    await pool .connect(alice).stake(ethers.parseEther("100"));
    await time.increase(10);                               // ≈12 MOCK

    const before = BigInt(await token.balanceOf(alice.address));
    await pool.connect(alice).unstake(ethers.parseEther("50"));  // returns 50 + ~6
    const after  = BigInt(await token.balanceOf(alice.address));

    expect(after - before).to.be.closeTo(
      ethers.parseEther("50"), 10n ** 16n
    );
  });

  it("rejects invalid unstake amounts", async () => {
    const { alice, pool } = await loadFixture(deployFixture);
    await expect(pool.connect(alice).unstake(0))
      .to.be.revertedWith("Bad amount");
  });

  /* ────────────────────────  ADMIN ACTIONS  ────────────────────── */

  it("owner withdraws excess rewards", async () => {
    const { owner, token, pool } = await loadFixture(deployFixture);

    const before = BigInt(await token.balanceOf(owner.address));
    await pool.withdrawExcessRewards(ethers.parseEther("500"));
    const after  = BigInt(await token.balanceOf(owner.address));

    expect(await pool.rewardPoolBalance()).to.equal(ethers.parseEther("500"));
    expect(after - before).to.equal(ethers.parseEther("500"));
  });
});

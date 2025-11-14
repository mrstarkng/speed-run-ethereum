import { expect } from "chai";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { ethers } from "hardhat";

async function deployFixture() {
  const [deployer, alice, bob] = await ethers.getSigners();

  const exampleExternalFactory = await ethers.getContractFactory("ExampleExternalContract");
  const exampleExternal = await exampleExternalFactory.deploy();
  await exampleExternal.waitForDeployment();

  const stakerFactory = await ethers.getContractFactory("Staker");
  const staker = await stakerFactory.deploy(exampleExternal.getAddress());
  await staker.waitForDeployment();

  return { staker, exampleExternal, deployer, alice, bob };
}

describe("Staker", function () {
  it("tracks balances and emits Stake events", async function () {
    const { staker, alice } = await loadFixture(deployFixture);
    const stakeAmount = ethers.parseEther("0.5");

    await expect(staker.connect(alice).stake({ value: stakeAmount }))
      .to.emit(staker, "Stake")
      .withArgs(alice.address, stakeAmount);

    const recordedBalance = await staker.balances(alice.address);
    expect(recordedBalance).to.equal(stakeAmount);
  });

  it("prevents staking after the deadline", async function () {
    const { staker, alice } = await loadFixture(deployFixture);

    await time.increase(31);

    await expect(staker.connect(alice).stake({ value: ethers.parseEther("0.1") })).to.be.revertedWith(
      "staking period has ended",
    );
  });

  it("returns time left until the deadline", async function () {
    const { staker } = await loadFixture(deployFixture);

    const initialTimeLeft = await staker.timeLeft();
    expect(initialTimeLeft).to.be.greaterThan(0);

    await time.increase(35);

    expect(await staker.timeLeft()).to.equal(0);
  });

  it("executes successfully when the threshold is met", async function () {
    const { staker, exampleExternal, alice, bob } = await loadFixture(deployFixture);

    await staker.connect(alice).stake({ value: ethers.parseEther("0.5") });
    await staker.connect(bob).stake({ value: ethers.parseEther("0.6") });

    await time.increase(31);

    await staker.execute();

    expect(await exampleExternal.completed()).to.equal(true);
    expect(await ethers.provider.getBalance(exampleExternal.getAddress())).to.equal(ethers.parseEther("1.1"));
  });

  it("opens withdrawals when the threshold is not met", async function () {
    const { staker, alice } = await loadFixture(deployFixture);

    const stakeAmount = ethers.parseEther("0.25");
    await staker.connect(alice).stake({ value: stakeAmount });

    await time.increase(31);

    await staker.execute();

    expect(await staker.openForWithdraw()).to.equal(true);

    await expect(staker.connect(alice).withdraw()).to.changeEtherBalances(
      [staker, alice],
      [stakeAmount * BigInt(-1), stakeAmount],
    );
  });

  it("does not allow withdrawals before execute opens them", async function () {
    const { staker, alice } = await loadFixture(deployFixture);

    await staker.connect(alice).stake({ value: ethers.parseEther("0.1") });

    await expect(staker.connect(alice).withdraw()).to.be.revertedWith("withdrawals not available");
  });
});

# Decentralized Staking Challenge Guide

This document summarizes the critical milestones for completing the SpeedRunEthereum "Decentralized Staking" challenge. It is written from the perspective of a mentor helping you structure the work and understand why each step matters.

## 1. Environment Checklist

Before you start hacking, double-check the local toolchain:

1. Install dependencies in both the Hardhat and Next.js workspaces.
   ```bash
   cd challenge-decentralized-stakin/hardhat
   yarn install

   cd ../nextjs
   yarn install
   ```
2. Generate a deployer account that can be reused for localhost and testnet deployments.
   ```bash
   cd challenge-decentralized-stakin/hardhat
   yarn generate
   ```
3. Copy the generated mnemonic/private key into the `.env` files for Hardhat and Next.js (the scaffold-eth template expects `DEPLOYER_PRIVATE_KEY`).
4. Start the local stack in three terminals:
   ```bash
   # Terminal 1 - local chain
   yarn chain

   # Terminal 2 - deploy contracts
   yarn deploy

   # Terminal 3 - frontend
   cd ../nextjs
   yarn dev
   ```

## 2. Smart Contract Expectations

The heart of the challenge lives in `challenge-decentralized-stakin/hardhat/contracts/Staker.sol`. Implement or review the following behaviors:

- **Stake tracking** – Map each address to the amount staked and emit a `Stake` event for the UI.
- **Deadline logic** – `deadline` should be set in the constructor, and `timeLeft()` must clamp at zero when the deadline passes.
- **Threshold execution** – When `threshold` ETH has been staked before the deadline, call `exampleExternalContract.complete{value: address(this).balance}()` and mark the external contract as completed.
- **Emergency withdrawal** – After the deadline, if the threshold was not met, stakers must be able to withdraw their contribution. Use a `withdraw()` function that zeroes out the sender’s balance before transferring funds.
- **Fallback handling** – Implement a `receive()` function that forwards ETH into the staking flow.

**Suggested Tests:**

- Staking records balances and emits events.
- `execute()` succeeds only before the deadline and only when the threshold is met.
- Withdrawals after the deadline refund correctly and cannot be re-entered.
- `timeLeft()` mirrors the configured deadline (fast-forward the Hardhat network time with `evm_increaseTime`).

## 3. Frontend Tasks

The Scaffold-ETH frontend inside `challenge-decentralized-stakin/nextjs` should surface the contract state clearly for users. Focus on:

- Displaying the live countdown (`timeLeft()`) and the staking threshold.
- Surfacing `ExampleExternalContract.completed` so the UI reflects when staking has succeeded.
- Allowing stakers to deposit, execute, and withdraw with clear button states (disable inappropriate actions).
- Rendering historical stakes by listening to the `Stake` event. Use the built-in hooks (`useEventListener`) to avoid manual RPC calls.

Remember that Scaffold-ETH already exposes `useScaffoldContractRead` and `useScaffoldContractWrite`. Leverage them instead of rolling custom viem logic.

## 4. Deployment Playbook

1. **Local smoke test** – Run through the staking flow on localhost. Confirm the execute and withdraw paths behave as expected.
2. **Unit tests** – Add Hardhat tests to cover the edge cases before shipping.
3. **Testnet deploy** –
   ```bash
   yarn deploy --network sepolia
   ```
   Make sure your deployer wallet has Sepolia ETH.
4. **Frontend env** – Update `NEXT_PUBLIC_TARGET_NETWORK` to `sepolia` for production builds and redeploy the Next.js app (Vercel or your provider).

## 5. Common Pitfalls

- Forgetting to guard `execute()` so it reverts after the deadline, which allows griefing.
- Not zeroing balances before transferring ETH back in `withdraw()`, leaving a re-entrancy opening.
- Missing the `completed` flag in the UI, leading to confusion about the staking outcome.
- Re-deploying without clearing cached `deployedContracts.ts`, causing ABI mismatches.

## 6. Extension Ideas

Once the base challenge is complete, consider stretching your skills:

- Add partial refunds or tiered rewards for early stakers.
- Surface a participation leaderboard by aggregating stake amounts in the frontend.
- Integrate a notification service (e.g., EPNS) to alert users when the deadline is near.

Use this guide as a checklist while you work. Keeping the flow disciplined will save debugging time and ensure the learning objectives of the challenge really stick.

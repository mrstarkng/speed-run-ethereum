# 🤖 AGENTS — System Actors for SpeedRunEthereum Challenges

This repository contains **multiple independent dApp projects**, each representing one SpeedRunEthereum challenge.  
Each challenge folder is a self-contained stack (Hardhat + Next.js + deployment scripts).

This document describes all *agents* (actors, modules, components) involved in these challenges and how they interact.



# 1. 📁 Repository Structure (Actual Layout)

```

speed-run-ethereum/
├── challenge-tokenization/         # Challenge 0 (Completed)
├── challenge-decentralized-stakin/ # Challenge 1 (In Progress)
├── AGENTS.md
├── LICENSE
└── README.md

```

Each challenge folder contains:

```

/challenge-X/
├── hardhat/           (smart contracts, deploy scripts)
├── nextjs/            (frontend UI)
├── deployedContracts/ (auto-generated after `yarn deploy`)
├── .env               (encrypted deployer PK, local env)
└── node_modules/

```


# 2. 🧱 Core Agents (common to all challenges)

## **2.1 Hardhat Node (Local Blockchain)**
- Started with `yarn chain` inside each challenge.
- Simulates an EVM-compatible blockchain locally.
- Provides 20 accounts with 10,000 ETH each.
- Resets on every restart.
- Used for testing before deploying to Sepolia.

## **2.2 Next.js Frontend**
- Started with `yarn start` inside each challenge.
- Provides UI to interact with smart contracts.
- Auto-loads contract ABI + addresses from `deployedContracts.ts`.
- Uses scaffold-eth hooks (wagmi + viem).

## **2.3 Deploy Scripts**
- Located inside `/hardhat/deploy/` of each challenge folder.
- Responsibilities:
  - Deploy ExampleExternalContract
  - Deploy Staker or YourCollectible
  - Write addresses & ABIs to `../nextjs/contracts/deployedContracts.ts`

## **2.4 MetaMask Wallets**
- Used to simulate user interactions:
  - Staking
  - Withdrawing
  - Executing flows
  - Minting NFTs

## **2.5 Deployer Wallet**
- Created via `yarn generate`
- Stored encrypted in `.env`
- Used to deploy to:
  - localhost (no balance needed)
  - Sepolia testnet (requires test ETH)



# 3. 🏷️ Challenge-Specific Agents



## 🔵 Challenge 0 — **Tokenization / YourCollectible**  
**Status:** ✔ Completed

### Smart Contract Agents
- `YourCollectible.sol`  
  - NFT minting logic  
  - Metadata URIs  
  - Events  
  - Owner-only functions  

### Frontend Agents
- NFT mint UI  
- Display token list  
- Metadata rendering  

### Storage Agents
- NFT images stored in:
```

challenge-tokenization/nextjs/public/

```
- Metadata served through Next.js API routes  
- Blockchain stores **only the token URI**, not image files



## 🟡 Challenge 1 — **Decentralized Staking**  
**Status:** 🟧 In Progress

### Smart Contract Agents
- `Staker.sol`  
- staking  
- tracking balances  
- emit `Stake` event  
- deadline logic  
- threshold logic  
- execute() → call external contract  
- withdraw() when threshold not met  
- timeLeft() helper  
- receive() payable

- `ExampleExternalContract.sol`  
- `complete()` receives ETH  
- `completed` flag for UI visibility  

### Frontend Agents
- Staker UI:
- stake form  
- withdrawal  
- execute action  
- status display (deadline, threshold, balances)  
- event list (“All Stakings”)

### Time / Execution Agents
- Deadline countdown (timeLeft())  
- State transition agents:
- “stake phase” (before deadline)  
- “execute phase” (after deadline)  
- “withdraw phase” (if threshold not met)



# 4. 🌐 Network Agents

## **Localhost (Hardhat Network)**
- Used during dev/testing
- Stateless blockchain
- No real consensus

## **Sepolia Testnet**
- Public Ethereum testnet
- Requires test ETH
- Contracts deployed persistently  
- Frontend can connect to this network once deployed

## **Vercel**
- Hosts frontend only (Next.js build)
- Does not run blockchain  
- UI interacts with contracts deployed on:
- localhost (from your machine only)
- Sepolia (global)



# 5. 🧠 Interaction Model (How Agents Communicate)

```

User (MetaMask)
⬇
Next.js Frontend  ← scaffold-eth hooks (viem/wagmi)
⬇
Smart Contracts (Hardhat/Sepolia)
⬇
ExampleExternalContract (Challenge 1 target)

```

And for NFT challenge:

```

User → Next.js → YourCollectible.sol → metadata URI → image host (Next.js public/)

```



# 6. 🎯 Current Progress

### ✔ Challenge 0 — Tokenization
- UI working, NFT minting verified
- Contract deployed successfully
- Frontend deployed (optional)

### 🟡 Challenge 1 — Decentralized Staking
- Contract implemented
- Need to finish:
  - UI validation
  - Event logs
  - Execute & withdrawal flows
  - Final deployment to Vercel + Sepolia


# 7. 📌 Purpose of This Document

This AGENTS.md file serves as:

- A high-level system map  
- A guide for future contributors  
- A reference for debugging  
- A documentation anchor for multi-challenge repo structures  

Use this document to quickly navigate the repo as new challenges are added.



# Challenge: Decentralized Staking

This package contains a Hardhat workspace and a Next.js frontend that together implement the SpeedRunEthereum "Decentralized Staking" challenge.

## Structure

```
challenge-decentralized-stakin/
├── packages/
│   ├── hardhat/   # Solidity contracts, deploy scripts, tests
│   └── nextjs/    # Next.js dapp that surfaces the staking UI
└── README.md
```

## Getting Started

### Contracts

```bash
cd packages/hardhat
yarn install
yarn test
```

To deploy the contracts locally and sync the frontend artifacts:

```bash
yarn deploy:localhost
```

### Frontend

```bash
cd packages/nextjs
yarn install
yarn dev
```

Open `http://localhost:3000/stakings` to interact with the staking dashboard. Remember to run `yarn deploy:localhost` first so the UI can load contract addresses and ABIs.

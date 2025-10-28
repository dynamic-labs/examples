# Circle Gateway Quickstart

This repository contains the runnable code for the Circle Gateway quickstart guide. It is designed to showcase the
capabilities of Gateway by first depositing USDC into Gateway on multiple chains, and then transferring it instantly to
a different chain.

## Instructions

First, install dependencies:

```bash
npm install
```

Create a file  called `.env` and add an Ethereum private key as `PRIVATE_KEY`. If you have Foundry installed, you can
easily generate a new private key using `cast wallet new`.

```env
PRIVATE_KEY="<your-private-key>"
```

Next, run the deposit script to deposit USDC into Gateway on multiple chains. If you are using a freshly-created wallet,
you'll need to fund it with USDC from the [Circle Faucet](https://faucet.circle.com/) and also with native gas tokens on
each chain.

```bash
node deposit.js
```

Once USDC has been deposited, the transactions need to be finalized on each chain before they will be available for use
in the Gateway API. On Avalanche, finality is instant and the deposits will be picked up within a few seconds, but on
Ethereum and Base, you'll need to wait for roughly 20 minutes.

Once the deposits are finalized, you can transfer USDC from your Gateway balance across both chains using the transfer
script:

```bash
node transfer.js
```

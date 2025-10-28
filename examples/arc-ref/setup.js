/**
 * Copyright 2025 Circle Internet Group, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import "dotenv/config";
import { createPublicClient, getContract, http, erc20Abi } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import * as chains from "viem/chains";
import { defineChain } from "viem";
import { GatewayClient } from "./gateway-client.js";
import { gatewayWalletAbi, gatewayMinterAbi } from "./abis.js";

// Define Arc Testnet chain
const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  network: "arc-testnet",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.testnet.arc.network"],
    },
  },
  blockExplorers: {
    default: {
      name: "Arc Scan",
      url: "https://testnet.arcscan.app",
    },
  },
});

// Addresses that are needed across networks
const gatewayWalletAddress = "0x0077777d7EBA4688BDeF3E311b846F25870A19B9";
const gatewayMinterAddress = "0x0022222ABE238Cc2C7Bb1f21003F0a260052475B";
const usdcAddresses = {
  sepolia: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
  baseSepolia: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  arcTestnet: "0x3600000000000000000000000000000000000000", 
};

// Custom chain map for Arc Testnet
const customChains = {
  arcTestnet: arcTestnet,
};

// Sets up a client and contracts for the given chain and account
function setup(chainName, account) {
  const chain = customChains[chainName] || chains[chainName];
  const client = createPublicClient({
    chain,
    account,
    // Use custom RPC for Arc Testnet, flashblocks-aware RPC for Base Sepolia, otherwise use the default RPC
    transport:
      chainName === "arcTestnet"
        ? http("https://rpc.testnet.arc.network")
        : chainName === "baseSepolia"
        ? http("https://sepolia-preconf.base.org")
        : http(),
  });

  return {
    client,
    name: chain.name,
    domain: chainName === "arcTestnet" ? 0 : GatewayClient.DOMAINS[chainName],
    currency: chain.nativeCurrency.symbol,
    usdc: getContract({ address: usdcAddresses[chainName], abi: erc20Abi, client }),
    gatewayWallet: getContract({ address: gatewayWalletAddress, abi: gatewayWalletAbi, client }),
    gatewayMinter: getContract({ address: gatewayMinterAddress, abi: gatewayMinterAbi, client }),
  };
}

// Create an account from the private key set in .env
export const account = privateKeyToAccount(process.env.PRIVATE_KEY);
console.log(`Using account: ${account.address}`);

// Set up clients and contracts for each chain
export const ethereum = setup("sepolia", account);
export const base = setup("baseSepolia", account);
export const arc = setup("arcTestnet", account);

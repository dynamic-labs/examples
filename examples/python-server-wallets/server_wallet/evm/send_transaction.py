"""
Dynamic EVM Send Transaction Demo

Sign and broadcast an Ethereum transaction in a single call using the SDK's
send_transaction method. The SDK handles signing via MPC and broadcasting
via the configured JSON-RPC endpoint.

## Usage

  python -m server_wallet.evm.send_transaction
  python -m server_wallet.evm.send_transaction --address 0x123...
  python -m server_wallet.evm.send_transaction --address 0x123... --password xyz

## How It Works

1. Fetch the current nonce and gas price from the network
2. Build a legacy transaction dictionary
3. The SDK signs it using MPC threshold signatures and broadcasts via JSON-RPC
4. Returns the transaction hash
"""

import argparse
from datetime import datetime

import httpx

from lib.cli import run_script
from lib.config import BASE_SEPOLIA_CHAIN_ID, EVM_RPC_URLS
from lib.dynamic import authenticated_evm_client
from lib.utils import get_transaction_link
from lib.wallet_helpers import get_or_create_evm_wallet

CHAIN_ID = BASE_SEPOLIA_CHAIN_ID


async def get_nonce(rpc_url: str, address: str) -> int:
    """Fetch the current transaction count (nonce) from the RPC provider."""
    async with httpx.AsyncClient() as http:
        resp = await http.post(rpc_url, json={
            "jsonrpc": "2.0",
            "id": 1,
            "method": "eth_getTransactionCount",
            "params": [address, "latest"],
        })
        result = resp.json().get("result", "0x0")
        return int(result, 16)


async def get_gas_price(rpc_url: str) -> int:
    """Fetch the current gas price from the RPC provider."""
    async with httpx.AsyncClient() as http:
        resp = await http.post(rpc_url, json={
            "jsonrpc": "2.0",
            "id": 1,
            "method": "eth_gasPrice",
            "params": [],
        })
        result = resp.json().get("result", "0x3B9ACA00")
        return int(result, 16)


async def send_transaction(address: str | None = None, password: str | None = None):
    rpc_url = EVM_RPC_URLS.get(CHAIN_ID)
    if not rpc_url:
        raise SystemExit(
            f"No RPC URL configured for chain {CHAIN_ID}. Set EVM_RPC_URL in .env"
        )

    async with await authenticated_evm_client() as client:
        # Step 1: Get or create wallet
        wallet_address, key_shares = await get_or_create_evm_wallet(client, address, password)

        # Step 2: Fetch nonce and gas price from the network
        print("\nFetching nonce and gas price...")
        nonce = await get_nonce(rpc_url, wallet_address)
        gas_price = await get_gas_price(rpc_url)
        print(f"Nonce: {nonce}")
        print(f"Gas price: {gas_price} wei")

        # Step 3: Build and send the transaction
        tx = {
            "to": "0x0000000000000000000000000000000000000000",
            "value": 0,
            "nonce": nonce,
            "gas": 21000,
            "gasPrice": gas_price,
            "chainId": CHAIN_ID,
            "data": "0x",
        }

        print("Sending EVM transaction...")
        start = datetime.now()

        tx_hash = await client.send_transaction(
            address=wallet_address,
            tx=tx,
            key_shares=key_shares,
        )

        duration = (datetime.now() - start).total_seconds()

        # Step 4: Display results
        print(f"\nTransaction sent in {duration:.2f}s")
        print(f"Hash: {tx_hash}")
        print(f"Explorer: {get_transaction_link(tx_hash)}")
        print(f"Wallet: {wallet_address}")

        return tx_hash


def main():
    parser = argparse.ArgumentParser(description="Send EVM transactions with Dynamic server wallets")
    parser.add_argument("--address", help="Use a saved wallet by address")
    parser.add_argument("--password", help="Password for password-protected wallets")

    args = parser.parse_args()

    run_script(lambda: send_transaction(args.address, args.password))


if __name__ == "__main__":
    main()

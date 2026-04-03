"""
Dynamic Solana Transaction Signing Demo

Sign Solana transactions with Dynamic server wallets. The SDK accepts
serialized message bytes and returns a hex-encoded Ed25519 signature that
can be attached to the transaction before broadcasting.

## Usage

  python -m server_wallet.svm.sign_transaction
  python -m server_wallet.svm.sign_transaction --address <solana_address>
  python -m server_wallet.svm.sign_transaction --address <addr> --password xyz

## How It Works

1. Fetch a recent blockhash from the Solana RPC
2. Build a SOL transfer transaction using solders
3. Sign the serialized message bytes using MPC threshold signatures
4. The returned hex signature can be attached to the transaction and broadcast
"""

import argparse
from datetime import datetime

import httpx
from solders.hash import Hash
from solders.message import Message
from solders.pubkey import Pubkey
from solders.system_program import TransferParams, transfer

from lib.cli import run_script
from lib.config import SOLANA_RPC_URL
from lib.dynamic import authenticated_svm_client
from lib.wallet_helpers import get_or_create_svm_wallet


async def get_recent_blockhash(rpc_url: str) -> str:
    """Fetch a recent blockhash from the Solana RPC."""
    async with httpx.AsyncClient() as http:
        resp = await http.post(rpc_url, json={
            "jsonrpc": "2.0",
            "id": 1,
            "method": "getLatestBlockhash",
            "params": [{"commitment": "finalized"}],
        })
        return resp.json()["result"]["value"]["blockhash"]


def build_transfer_message(from_pubkey: Pubkey, blockhash: str) -> bytes:
    """Build a minimal SOL transfer (0 lamports to self) and return serialized message bytes."""
    ix = transfer(TransferParams(
        from_pubkey=from_pubkey,
        to_pubkey=from_pubkey,
        lamports=0,
    ))
    msg = Message.new_with_blockhash(
        [ix],
        from_pubkey,
        Hash.from_string(blockhash),
    )
    return bytes(msg)


async def sign_transaction(address: str | None = None, password: str | None = None):
    rpc_url = SOLANA_RPC_URL
    if not rpc_url:
        raise SystemExit("No Solana RPC URL configured. Set SOLANA_RPC_URL in .env")

    async with await authenticated_svm_client() as client:
        # Step 1: Get or create wallet
        wallet_address, key_shares = await get_or_create_svm_wallet(client, address, password)

        # Step 2: Build transaction
        print("\nFetching recent blockhash...")
        blockhash = await get_recent_blockhash(rpc_url)
        from_pubkey = Pubkey.from_string(wallet_address)
        message_bytes = build_transfer_message(from_pubkey, blockhash)

        # Step 3: Sign the message bytes using MPC threshold signatures (Ed25519)
        # Returns a hex-encoded Ed25519 signature (128 hex chars / 64 bytes)
        print("Signing Solana transaction...")
        start = datetime.now()

        signature_hex = await client.sign_transaction(
            address=wallet_address,
            message_bytes=message_bytes,
            key_shares=key_shares,
        )

        duration = (datetime.now() - start).total_seconds()

        # Step 4: Display results
        print(f"\nTransaction signed in {duration:.2f}s")
        print(f"Signature (hex): {signature_hex}")
        print(f"Signer: {wallet_address}")

        return signature_hex


def main():
    parser = argparse.ArgumentParser(description="Sign Solana transactions with Dynamic server wallets")
    parser.add_argument("--address", help="Use a saved wallet by address")
    parser.add_argument("--password", help="Password for password-protected wallets")

    args = parser.parse_args()

    run_script(lambda: sign_transaction(args.address, args.password))


if __name__ == "__main__":
    main()

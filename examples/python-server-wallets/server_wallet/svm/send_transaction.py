"""
Dynamic Solana Send Transaction Demo

Sign and broadcast a Solana transaction in a single call using the SDK's
send_transaction method. The SDK handles signing via MPC and broadcasting
via the configured Solana RPC endpoint.

## Usage

  python -m server_wallet.svm.send_transaction
  python -m server_wallet.svm.send_transaction --address <solana_address>
  python -m server_wallet.svm.send_transaction --address <addr> --password xyz
  python -m server_wallet.svm.send_transaction --address <addr> --sponsored

## How It Works

1. Fetch a recent blockhash from the Solana RPC
2. Build a SOL transfer transaction using solders
3. The SDK signs the message bytes via MPC, attaches the signature, and broadcasts
4. Returns the transaction signature (base58)

With --sponsored, Dynamic's gas sponsorship service pays the transaction fees.
The user's wallet doesn't need SOL. Requires gas sponsorship enabled in the
Dynamic dashboard.
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


async def send_transaction(
    address: str | None = None,
    password: str | None = None,
    sponsored: bool = False,
):
    rpc_url = SOLANA_RPC_URL
    if not rpc_url:
        raise SystemExit("No Solana RPC URL configured. Set SOLANA_RPC_URL in .env")

    async with await authenticated_svm_client() as client:
        # Step 1: Get or create wallet
        wallet_address, key_shares = await get_or_create_svm_wallet(client, address, password)

        # Step 2: Build transaction
        print("\nFetching recent blockhash...")
        blockhash = await get_recent_blockhash(rpc_url)
        print(f"Blockhash: {blockhash}")

        from_pubkey = Pubkey.from_string(wallet_address)
        message_bytes = build_transfer_message(from_pubkey, blockhash)

        # Step 3: Sign and broadcast
        if sponsored:
            print("Sending sponsored Solana transaction (Dynamic pays gas)...")
        else:
            print("Sending Solana transaction...")
        start = datetime.now()

        signature = await client.send_transaction(
            address=wallet_address,
            message_bytes=message_bytes,
            key_shares=key_shares,
            sponsor=sponsored,
        )

        duration = (datetime.now() - start).total_seconds()

        # Step 4: Display results
        print(f"\nTransaction sent in {duration:.2f}s")
        print(f"Signature: {signature}")
        print(f"Explorer: https://explorer.solana.com/tx/{signature}?cluster=devnet")
        print(f"Wallet: {wallet_address}")
        if sponsored:
            print(f"Gas paid by: Dynamic sponsor")

        return signature


def main():
    parser = argparse.ArgumentParser(description="Send Solana transactions with Dynamic server wallets")
    parser.add_argument("--address", help="Use a saved wallet by address")
    parser.add_argument("--password", help="Password for password-protected wallets")
    parser.add_argument("--sponsored", action="store_true", help="Use Dynamic gas sponsorship (wallet doesn't need SOL)")

    args = parser.parse_args()

    run_script(lambda: send_transaction(args.address, args.password, args.sponsored))


if __name__ == "__main__":
    main()

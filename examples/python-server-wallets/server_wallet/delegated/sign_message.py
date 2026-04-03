"""
Delegated Wallet Message Signing Demo

Sign messages using a delegated wallet for authentication and verification.

## Prerequisites

This script requires a wallet.json file with delegated access credentials.
See wallet.json.example for the required format.

The delegated share is obtained through a separate process where the user
grants your application permission to sign on their behalf.

## Usage

  python -m server_wallet.delegated.sign_message "Hello, World!"

## Use Cases

- Authenticate users by proving wallet ownership
- Sign authorization tokens or session data
- Verify identity without on-chain transactions
- Create off-chain signatures for gasless flows
"""

import argparse
import json
from datetime import datetime
from pathlib import Path

from lib.cli import run_script
from lib.dynamic import delegated_evm_client, delegated_sign_message

WALLET_FILE = Path(__file__).parent / "wallet.json"


async def sign_message(message: str):
    # Load delegated wallet credentials
    if not WALLET_FILE.exists():
        raise SystemExit(
            "wallet.json not found in server_wallet/delegated/ directory.\n"
            "See wallet.json.example for the required format.\n"
            "See README.md for how to obtain delegated access credentials."
        )

    wallet = json.loads(WALLET_FILE.read_text())

    # Step 1: Create delegated client
    client = await delegated_evm_client()

    print("\nSigning message...")
    start = datetime.now()

    # Step 2: Sign using the wallet owner's delegated share
    signature = await delegated_sign_message(
        client,
        wallet_id=wallet["walletId"],
        wallet_api_key=wallet["walletApiKey"],
        key_share=wallet["delegatedShare"],
        message=message,
        chain_name="EVM",
        is_formatted=False,
    )

    # Step 3: Display results
    duration = (datetime.now() - start).total_seconds()
    print(f"\nMessage signed in {duration:.2f}s")
    print(f"Message: \"{message}\"")
    print(f"Signature: {signature}")

    return signature


def main():
    parser = argparse.ArgumentParser(description="Sign messages with delegated wallets")
    parser.add_argument("message", help="Message to sign")

    args = parser.parse_args()

    run_script(lambda: sign_message(args.message))


if __name__ == "__main__":
    main()

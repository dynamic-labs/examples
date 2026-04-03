"""
Dynamic Solana Message Signing Demo

Sign messages with Solana server wallets using Ed25519 signatures.

## Usage

  python -m server_wallet.svm.sign_message "Hello, Solana!"
  python -m server_wallet.svm.sign_message "Hello, Solana!" --address <solana_address>
  python -m server_wallet.svm.sign_message "Hello, Solana!" --address <addr> --password xyz

## Use Cases

- Authenticate users by proving Solana wallet ownership
- Sign authorization tokens or session data
- Verify identity without on-chain transactions
"""

import argparse
from datetime import datetime

from lib.cli import run_script
from lib.dynamic import authenticated_svm_client
from lib.wallet_helpers import get_or_create_svm_wallet


async def sign_message(message: str, address: str | None = None, password: str | None = None):
    async with await authenticated_svm_client() as client:
        # Step 1: Get or create wallet
        wallet_address, key_shares = await get_or_create_svm_wallet(client, address, password)

        # Step 2: Sign the message using MPC threshold signatures (Ed25519)
        print("\nSigning message...")
        start = datetime.now()

        # Returns a base58-encoded Ed25519 signature
        signature = await client.sign_message(
            message=message,
            address=wallet_address,
            key_shares=key_shares,
        )

        duration = (datetime.now() - start).total_seconds()

        # Step 3: Display results
        print(f"\nMessage signed in {duration:.2f}s")
        print(f"Message: \"{message}\"")
        print(f"Signature (base58): {signature}")
        print(f"Signer: {wallet_address}")

        return signature


def main():
    parser = argparse.ArgumentParser(description="Sign messages with Solana server wallets")
    parser.add_argument("message", help="Message to sign")
    parser.add_argument("--address", help="Use a saved wallet by address")
    parser.add_argument("--password", help="Password for password-protected wallets")

    args = parser.parse_args()

    run_script(lambda: sign_message(args.message, args.address, args.password))


if __name__ == "__main__":
    main()

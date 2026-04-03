"""
Dynamic Message Signing Demo

Sign messages with Dynamic server wallets for authentication,
verification, and proof of ownership.

## Usage

  python -m server_wallet.evm.sign_message "Hello, World!"
  python -m server_wallet.evm.sign_message "Hello, World!" --address 0x123...
  python -m server_wallet.evm.sign_message "Hello, World!" --address 0x123... --password xyz

## Use Cases

- Authenticate users by proving wallet ownership
- Sign authorization tokens or session data
- Verify identity without on-chain transactions
- Create off-chain signatures for gasless flows
"""

import argparse
from datetime import datetime

from lib.cli import run_script
from lib.dynamic import authenticated_evm_client
from lib.wallet_helpers import get_or_create_evm_wallet


async def sign_message(message: str, address: str | None = None, password: str | None = None):
    async with await authenticated_evm_client() as client:
        # Step 1: Get or create wallet
        wallet_address, key_shares = await get_or_create_evm_wallet(client, address, password)

        # Step 2: Sign the message using MPC threshold signatures
        print("\nSigning message...")
        start = datetime.now()

        signature = await client.sign_message(
            message=message,
            address=wallet_address,
            key_shares=key_shares,
        )

        duration = (datetime.now() - start).total_seconds()

        # Step 3: Display results
        print(f"\nMessage signed in {duration:.2f}s")
        print(f"Message: \"{message}\"")
        print(f"Signature: {signature}")
        print(f"Signer: {wallet_address}")

        return signature


def main():
    parser = argparse.ArgumentParser(description="Sign messages with Dynamic server wallets")
    parser.add_argument("message", help="Message to sign")
    parser.add_argument("--address", help="Use a saved wallet by address")
    parser.add_argument("--password", help="Password for password-protected wallets")

    args = parser.parse_args()

    run_script(lambda: sign_message(args.message, args.address, args.password))


if __name__ == "__main__":
    main()

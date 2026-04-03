"""
Dynamic Key Share Recovery Demo

Recover backed-up key shares for a wallet that was created with a password.
This is useful when you need to restore signing ability in a new session.

## Usage

  python -m server_wallet.evm.recover_key_shares --address 0x123... --password myPassword

## How It Works

1. When creating a wallet with --password, key shares are encrypted and backed up
2. In a new session, the client doesn't have the key shares in memory
3. recover_key_shares() fetches and decrypts the backed-up shares
4. After recovery, the client can sign messages and transactions with this wallet
"""

import argparse
from datetime import datetime

from lib.cli import run_script
from lib.dynamic import authenticated_evm_client
from lib.wallet_storage import get_wallet


async def recover_key_shares(address: str, password: str):
    # Verify the wallet exists in local storage
    stored = get_wallet(address)
    if not stored:
        raise SystemExit(
            f"Wallet not found in storage: {address}\n"
            "Tip: Use 'python -m server_wallet.evm.wallet --list' to see saved wallets"
        )

    async with await authenticated_evm_client() as client:
        print(f"Recovering key shares for: {address}")
        start = datetime.now()

        # Load this specific wallet into the client's map (single API call)
        await client.load_wallet(address)

        # Recover the encrypted key shares from Dynamic's backup service
        # This decrypts and loads the key shares into the client instance
        await client.recover_key_shares(address, password=password)

        duration = (datetime.now() - start).total_seconds()
        print(f"\nKey shares recovered in {duration:.2f}s")
        print(f"Wallet: {address}")

        # Demonstrate that signing now works after recovery
        print("\nVerifying recovery by signing a test message...")
        signature = await client.sign_message(
            message="recovery-verification",
            address=address,
        )
        print(f"Verification signature: {signature}")
        print("Key share recovery successful - wallet is ready to use")


def main():
    parser = argparse.ArgumentParser(description="Recover key shares for a password-protected wallet")
    parser.add_argument("--address", required=True, help="Wallet address to recover")
    parser.add_argument("--password", required=True, help="Password used during wallet creation")

    args = parser.parse_args()

    run_script(lambda: recover_key_shares(args.address, args.password))


if __name__ == "__main__":
    main()

"""
Dynamic EIP-712 Typed Data Signing Demo

Sign structured data (EIP-712) with Dynamic server wallets.
Typed data signing is used for off-chain signatures that can be
verified on-chain, commonly used in permit signatures, meta-transactions,
and gasless approvals.

## Usage

  python -m server_wallet.evm.sign_typed_data
  python -m server_wallet.evm.sign_typed_data --address 0x123...
  python -m server_wallet.evm.sign_typed_data --address 0x123... --password xyz

## Use Cases

- ERC-20 permit signatures (gasless approvals)
- Meta-transactions and gasless flows
- Off-chain order signing (DEXs, NFT marketplaces)
- Structured message verification
"""

import argparse
from datetime import datetime

from lib.cli import run_script
from lib.dynamic import authenticated_evm_client
from lib.wallet_helpers import get_or_create_evm_wallet

# Example EIP-712 typed data for demonstration
# This follows the EIP-712 specification for structured data hashing and signing
EXAMPLE_TYPED_DATA = {
    "types": {
        "EIP712Domain": [
            {"name": "name", "type": "string"},
            {"name": "version", "type": "string"},
            {"name": "chainId", "type": "uint256"},
        ],
        "Mail": [
            {"name": "from", "type": "string"},
            {"name": "to", "type": "string"},
            {"name": "contents", "type": "string"},
        ],
    },
    "primaryType": "Mail",
    "domain": {
        "name": "Dynamic Example",
        "version": "1",
        "chainId": 84532,  # Base Sepolia
    },
    "message": {
        "from": "Alice",
        "to": "Bob",
        "contents": "Hello from Dynamic!",
    },
}


async def sign_typed_data(address: str | None = None, password: str | None = None):
    async with await authenticated_evm_client() as client:
        # Step 1: Get or create wallet
        wallet_address, key_shares = await get_or_create_evm_wallet(client, address, password)

        # Step 2: Sign the typed data using MPC threshold signatures
        print("\nSigning EIP-712 typed data...")
        start = datetime.now()

        signature = await client.sign_typed_data(
            address=wallet_address,
            typed_data=EXAMPLE_TYPED_DATA,
            key_shares=key_shares,
        )

        duration = (datetime.now() - start).total_seconds()

        # Step 3: Display results
        print(f"\nTyped data signed in {duration:.2f}s")
        print(f"Domain: {EXAMPLE_TYPED_DATA['domain']['name']}")
        print(f"Primary type: {EXAMPLE_TYPED_DATA['primaryType']}")
        print(f"Signature: {signature}")
        print(f"Signer: {wallet_address}")

        return signature


def main():
    parser = argparse.ArgumentParser(description="Sign EIP-712 typed data with Dynamic server wallets")
    parser.add_argument("--address", help="Use a saved wallet by address")
    parser.add_argument("--password", help="Password for password-protected wallets")

    args = parser.parse_args()

    run_script(lambda: sign_typed_data(args.address, args.password))


if __name__ == "__main__":
    main()

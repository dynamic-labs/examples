"""
Dynamic EVM Transaction Signing Demo

Sign Ethereum transactions with Dynamic server wallets. The SDK returns
a hex-encoded RLP-serialized signed transaction ready for broadcast
via any Ethereum JSON-RPC provider (e.g., web3.py).

## Usage

  python -m server_wallet.evm.sign_transaction
  python -m server_wallet.evm.sign_transaction --address 0x123...
  python -m server_wallet.evm.sign_transaction --address 0x123... --password xyz

## How It Works

1. Build a transaction dictionary with standard EVM fields
2. Sign it using MPC threshold signatures via the SDK
3. Broadcast the signed transaction using web3.py or any RPC provider

## Note

The SDK currently supports legacy transactions (gasPrice) only.
"""

import argparse
from datetime import datetime

from lib.cli import run_script
from lib.dynamic import authenticated_evm_client
from lib.wallet_helpers import get_or_create_evm_wallet

# Example legacy transaction on Base Sepolia (chain ID 84532)
# The SDK currently supports legacy transactions (gasPrice) only.
# In production, you would fetch nonce, gas price, etc. from an RPC provider.
EXAMPLE_TX = {
    "to": "0x0000000000000000000000000000000000000000",
    "value": 0,
    "nonce": 0,
    "gas": 21000,
    "gasPrice": 1000000000,  # 1 gwei
    "chainId": 84532,        # Base Sepolia
    "data": "0x",
}


async def sign_transaction(address: str | None = None, password: str | None = None):
    async with await authenticated_evm_client() as client:
        # Step 1: Get or create wallet
        wallet_address, key_shares = await get_or_create_evm_wallet(client, address, password)

        # Step 2: Sign the transaction using MPC threshold signatures
        # Returns a hex-encoded RLP-serialized signed transaction
        print("\nSigning EVM transaction...")
        start = datetime.now()

        signed_tx = await client.sign_transaction(
            address=wallet_address,
            tx=EXAMPLE_TX,
            key_shares=key_shares,
        )

        duration = (datetime.now() - start).total_seconds()

        # Step 3: Display results
        print(f"\nTransaction signed in {duration:.2f}s")
        print(f"Chain: Base Sepolia (84532)")
        print(f"Signed TX (hex): {signed_tx[:40]}...")
        print(f"Signer: {wallet_address}")
        print()
        print("To broadcast, use web3.py:")
        print("  w3.eth.send_raw_transaction(signed_tx)")

        return signed_tx


def main():
    parser = argparse.ArgumentParser(description="Sign EVM transactions with Dynamic server wallets")
    parser.add_argument("--address", help="Use a saved wallet by address")
    parser.add_argument("--password", help="Password for password-protected wallets")

    args = parser.parse_args()

    run_script(lambda: sign_transaction(args.address, args.password))


if __name__ == "__main__":
    main()

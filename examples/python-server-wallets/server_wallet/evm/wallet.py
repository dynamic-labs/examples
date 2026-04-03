"""
Dynamic Server Wallet Management

Create and manage server-side wallets for automated operations like
omnibus payments, treasury management, and gasless transactions.

## Creating Wallets

Create ephemeral wallets for one-time use:
  python -m server_wallet.evm.wallet --create

Create and save wallets for reuse (key shares stored locally):
  python -m server_wallet.evm.wallet --create --save

Create with key shares backed up to Dynamic (requires password to sign):
  python -m server_wallet.evm.wallet --create --save --backup --password mySecretPassword

## Managing Saved Wallets

List all saved wallets:
  python -m server_wallet.evm.wallet --list

Delete a saved wallet:
  python -m server_wallet.evm.wallet --delete 0x123...
"""

import argparse
from datetime import datetime, timezone

from lib.cli import run_script
from lib.dynamic import ThresholdSignatureScheme, authenticated_evm_client
from lib.wallet_storage import (
    delete_wallet, list_wallets, save_wallet,
    StoredWallet, StoredKeyShare,
)


async def create_wallet(
    should_save: bool,
    password: str | None = None,
    threshold: int = 2,
    backup: bool = False,
):
    scheme = ThresholdSignatureScheme.TWO_OF_TWO if threshold == 2 else ThresholdSignatureScheme.TWO_OF_THREE

    # Step 1: Authenticate with Dynamic using your API token
    async with await authenticated_evm_client() as client:
        print(f"Creating server wallet ({scheme.value})...")
        start = datetime.now()

        # Step 2: Create a new server-side wallet
        # The SDK always backs up key shares to Dynamic.
        # - password: Encrypts the backup. Required for recovery in future sessions.
        #   If omitted, environment_id is used (backup not recoverable by password).
        wallet = await client.create_wallet_account(
            threshold_signature_scheme=scheme,
            password=password,
        )

        duration = (datetime.now() - start).total_seconds()
        print(f"Server wallet created in {duration:.2f}s")
        print(f"Address: {wallet.account_address}")
        print(f"Wallet ID: {wallet.wallet_id}")
        if backup:
            print("Key shares backed up to Dynamic")
        if password:
            print("Password protection enabled")

        if should_save:
            if backup:
                # When --backup: only save address/wallet_id, no key shares.
                # Signing requires --password to recover shares from Dynamic's backup.
                save_wallet(StoredWallet(
                    address=wallet.account_address,
                    wallet_id=wallet.wallet_id,
                    chain="evm",
                    created_at=datetime.now(timezone.utc).isoformat(),
                    key_shares=[],
                ))
            else:
                # Default: save key shares locally for direct signing (no password needed).
                # In production, store key shares in a secure key management service.
                save_wallet(StoredWallet(
                    address=wallet.account_address,
                    wallet_id=wallet.wallet_id,
                    chain="evm",
                    created_at=datetime.now(timezone.utc).isoformat(),
                    key_shares=[
                        StoredKeyShare(
                            key_share_id=ks.key_share_id,
                            secret_share=ks.secret_share,
                        )
                        for ks in wallet.external_server_key_shares
                    ],
                ))
        else:
            print("Tip: Add '--save' flag to persist wallet for reuse")


def display_wallet_list():
    wallets = list_wallets()

    if not wallets:
        print("No saved wallets found")
        print("Tip: Use 'python -m server_wallet.evm.wallet --create --save' to create a wallet")
        return

    evm_wallets = [w for w in wallets if w.chain == "evm"]
    if not evm_wallets:
        print("No saved EVM wallets found")
        return

    print(f"Saved EVM wallets ({len(evm_wallets)}):\n")
    for i, w in enumerate(evm_wallets, 1):
        print(f"{i}. {w.address}")
        print(f"   Wallet ID: {w.wallet_id}")
        print(f"   Key shares: {'backed up to Dynamic' if not w.key_shares else 'stored locally'}")
        print(f"   Created: {w.created_at}")
        print()


def remove_wallet(address: str):
    if not delete_wallet(address):
        raise SystemExit(
            f"Wallet not found: {address}\n"
            "Tip: Use 'python -m server_wallet.evm.wallet --list' to see saved wallets"
        )
    print("Wallet deleted successfully")


def main():
    parser = argparse.ArgumentParser(description="Dynamic Server Wallet Management")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--create", action="store_true", help="Create a new wallet")
    group.add_argument("--list", action="store_true", help="List saved wallets")
    group.add_argument("--delete", metavar="ADDRESS", help="Delete a saved wallet")
    parser.add_argument("--save", action="store_true", help="Save wallet for reuse")
    parser.add_argument("--backup", action="store_true", help="Only store key shares in Dynamic's backup (requires --password to sign)")
    parser.add_argument("--password", help="Password for key share encryption")
    parser.add_argument("--threshold", type=int, choices=[2, 3], default=2, help="Threshold scheme: 2 (two-of-two) or 3 (two-of-three)")

    args = parser.parse_args()

    if args.list:
        display_wallet_list()
    elif args.delete:
        remove_wallet(args.delete)
    elif args.create:
        run_script(lambda: create_wallet(args.save, args.password, args.threshold, args.backup))


if __name__ == "__main__":
    main()

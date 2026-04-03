"""
Dynamic Solana (SVM) Server Wallet Management

Create and manage Solana server-side wallets using Ed25519 key pairs.

## Creating Wallets

Create ephemeral wallets for one-time use:
  python -m server_wallet.svm.wallet --create

Create and save wallets for reuse (key shares stored locally):
  python -m server_wallet.svm.wallet --create --save

Create with key shares backed up to Dynamic (requires password to sign):
  python -m server_wallet.svm.wallet --create --save --backup --password mySecretPassword

## Managing Saved Wallets

List all saved wallets:
  python -m server_wallet.svm.wallet --list

Delete a saved wallet:
  python -m server_wallet.svm.wallet --delete <address>
"""

import argparse
from datetime import datetime, timezone

from lib.cli import run_script
from lib.dynamic import ThresholdSignatureScheme, authenticated_svm_client
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

    async with await authenticated_svm_client() as client:
        print(f"Creating Solana server wallet ({scheme.value})...")
        start = datetime.now()

        wallet = await client.create_wallet_account(
            threshold_signature_scheme=scheme,
            password=password,
        )

        duration = (datetime.now() - start).total_seconds()
        print(f"Solana server wallet created in {duration:.2f}s")
        print(f"Address: {wallet.account_address}")
        print(f"Wallet ID: {wallet.wallet_id}")
        if backup:
            print("Key shares backed up to Dynamic")
        if password:
            print("Password protection enabled")

        if should_save:
            if backup:
                save_wallet(StoredWallet(
                    address=wallet.account_address,
                    wallet_id=wallet.wallet_id,
                    chain="svm",
                    created_at=datetime.now(timezone.utc).isoformat(),
                    key_shares=[],
                ))
            else:
                save_wallet(StoredWallet(
                    address=wallet.account_address,
                    wallet_id=wallet.wallet_id,
                    chain="svm",
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
    svm_wallets = [w for w in wallets if w.chain == "svm"]

    if not svm_wallets:
        print("No saved SVM wallets found")
        print("Tip: Use 'python -m server_wallet.svm.wallet --create --save' to create a wallet")
        return

    print(f"Saved SVM wallets ({len(svm_wallets)}):\n")
    for i, w in enumerate(svm_wallets, 1):
        print(f"{i}. {w.address}")
        print(f"   Wallet ID: {w.wallet_id}")
        print(f"   Key shares: {'backed up to Dynamic' if not w.key_shares else 'stored locally'}")
        print(f"   Created: {w.created_at}")
        print()


def remove_wallet(address: str):
    if not delete_wallet(address):
        raise SystemExit(
            f"Wallet not found: {address}\n"
            "Tip: Use 'python -m server_wallet.svm.wallet --list' to see saved wallets"
        )
    print("Wallet deleted successfully")


def main():
    parser = argparse.ArgumentParser(description="Dynamic Solana Server Wallet Management")
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

"""
Wallet Helpers

Shared logic for retrieving saved wallets or creating new ephemeral wallets.
"""

from dynamic_wallet_sdk.evm.client import DynamicEvmWalletClient
from dynamic_wallet_sdk.mpc.types import ServerKeyShare
from dynamic_wallet_sdk.svm.client import DynamicSvmWalletClient

from .wallet_storage import get_wallet, StoredWallet


def _load_key_shares(stored: StoredWallet) -> list[ServerKeyShare]:
    """Load a single key share from storage for signing.

    For multi-share schemes (2-of-3), only the first share is needed
    since the SDK combines it with Dynamic's server-side share(s) to meet
    the threshold.
    """
    ks = stored.key_shares[0]
    return [ServerKeyShare(key_share_id=ks.key_share_id, secret_share=ks.secret_share)]


async def get_or_create_evm_wallet(
    client: DynamicEvmWalletClient,
    address: str | None = None,
    password: str | None = None,
) -> tuple[str, list[ServerKeyShare] | None]:
    """
    Get an existing wallet or create a new ephemeral one.

    If address is provided, loads from storage including key shares.
    If key shares are empty (backed up to Dynamic), recovers them with password.
    Otherwise, creates a new wallet.

    Returns (wallet_address, key_shares or None).
    """
    if address:
        print(f"Looking up wallet: {address}")
        stored = get_wallet(address)

        if not stored:
            raise SystemExit(
                f"Wallet not found: {address}\n"
                "Tip: Use 'python -m server_wallet.wallet --list' to see saved wallets"
            )

        # Register wallet in client's internal map (required for signing)
        await client.load_wallet(address)

        # If key shares are stored locally, use them directly
        if stored.key_shares:
            print("Loaded wallet from storage")
            return stored.address, _load_key_shares(stored)

        # Key shares were backed up to Dynamic — recover with password
        if not password:
            raise SystemExit(
                "This wallet's key shares are backed up to Dynamic. "
                "Provide --password to recover them."
            )

        print("Recovering key shares from backup...")
        shares = await client.recover_key_shares(address, password=password)
        print("Key shares recovered")
        return stored.address, shares

    # Create new ephemeral wallet
    print("Creating new wallet...")
    wallet = await client.create_wallet_account(password=password)
    print(f"Wallet created: {wallet.account_address}")
    return wallet.account_address, None


async def get_or_create_svm_wallet(
    client: DynamicSvmWalletClient,
    address: str | None = None,
    password: str | None = None,
) -> tuple[str, list[ServerKeyShare] | None]:
    """
    Get an existing SVM wallet or create a new ephemeral one.
    Returns (wallet_address, key_shares or None).
    """
    if address:
        print(f"Looking up wallet: {address}")
        stored = get_wallet(address)

        if not stored:
            raise SystemExit(
                f"Wallet not found: {address}\n"
                "Tip: Use 'python -m server_wallet.svm.wallet --list' to see saved wallets"
            )

        await client.load_wallet(address)

        if stored.key_shares:
            print("Loaded wallet from storage")
            return stored.address, _load_key_shares(stored)

        if not password:
            raise SystemExit(
                "This wallet's key shares are backed up to Dynamic. "
                "Provide --password to recover them."
            )

        print("Recovering key shares from backup...")
        shares = await client.recover_key_shares(address, password=password)
        print("Key shares recovered")
        return stored.address, shares

    print("Creating new wallet...")
    wallet = await client.create_wallet_account(password=password)
    print(f"Wallet created: {wallet.account_address}")
    return wallet.account_address, None

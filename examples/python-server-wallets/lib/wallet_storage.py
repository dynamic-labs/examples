"""
Wallet Storage Utilities

WARNING: FOR TESTING AND DEVELOPMENT ONLY - NOT FOR PRODUCTION USE

This file provides simple file-based storage for wallet metadata and key shares.
It is intended ONLY for local development and testing purposes.

DO NOT USE IN PRODUCTION because:
- Key shares are stored unencrypted in a local JSON file
- No access control or security measures are implemented
- No backup or recovery mechanisms

For production environments, you should:
- Use a secure key management service (AWS KMS, HashiCorp Vault, etc.)
- Encrypt key shares at rest
- Implement proper access controls and audit logging
- Follow your organization's security best practices
"""

import json
from dataclasses import dataclass, asdict, field
from pathlib import Path

WALLET_FILE = Path.cwd() / ".wallets.json"


@dataclass
class StoredKeyShare:
    key_share_id: str
    secret_share: str


@dataclass
class StoredWallet:
    address: str
    wallet_id: str
    chain: str  # "evm" or "svm"
    created_at: str
    key_shares: list[StoredKeyShare] = field(default_factory=list)


def load_wallets() -> dict[str, StoredWallet]:
    """Load all saved wallets from local storage."""
    if not WALLET_FILE.exists():
        return {}

    try:
        data = json.loads(WALLET_FILE.read_text())
        wallets = {}
        for addr, w in data.items():
            key_shares = [StoredKeyShare(**ks) for ks in w.get("key_shares", [])]
            wallets[addr] = StoredWallet(
                address=w["address"],
                wallet_id=w["wallet_id"],
                chain=w["chain"],
                created_at=w["created_at"],
                key_shares=key_shares,
            )
        return wallets
    except (json.JSONDecodeError, TypeError, KeyError) as e:
        print(f"Warning: Failed to load wallets file: {e}")
        return {}


def save_wallet(wallet: StoredWallet) -> None:
    """Save a wallet to local storage."""
    wallets = load_wallets()
    wallets[wallet.address] = wallet

    raw = {addr: asdict(w) for addr, w in wallets.items()}
    WALLET_FILE.write_text(json.dumps(raw, indent=2))
    print(f"Wallet saved to {WALLET_FILE}")


def get_wallet(address: str) -> StoredWallet | None:
    """Get a specific wallet by address."""
    wallets = load_wallets()
    return wallets.get(address)


def list_wallets() -> list[StoredWallet]:
    """List all saved wallets."""
    wallets = load_wallets()
    return list(wallets.values())


def delete_wallet(address: str) -> bool:
    """Delete a wallet from local storage."""
    wallets = load_wallets()

    if address not in wallets:
        return False

    del wallets[address]
    raw = {addr: asdict(w) for addr, w in wallets.items()}
    WALLET_FILE.write_text(json.dumps(raw, indent=2))
    print(f"Wallet {address} deleted")
    return True

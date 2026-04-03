"""
Smoke Test

Runs core SDK flows end-to-end to verify everything works.
Requires DYNAMIC_API_TOKEN and DYNAMIC_ENV_ID in .env.

Usage:
  python smoke_test.py           # EVM only
  python smoke_test.py --svm     # EVM + Solana
"""

import argparse
import asyncio
import sys
import time

from eth_account import Account
from eth_account.messages import encode_defunct

from dynamic_wallet_sdk import ThresholdSignatureScheme
from dynamic_wallet_sdk.mpc.types import ServerKeyShare

from lib.config import DYNAMIC_ENV_ID
from lib.dynamic import authenticated_evm_client, authenticated_svm_client
from lib.wallet_helpers import get_or_create_evm_wallet, get_or_create_svm_wallet
from lib.wallet_storage import (
    WALLET_FILE,
    StoredWallet,
    StoredKeyShare,
    save_wallet,
    get_wallet,
    list_wallets,
    delete_wallet,
)


class SmokeTest:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.errors: list[str] = []

    def ok(self, name: str, duration: float):
        self.passed += 1
        print(f"  PASS  {name} ({duration:.2f}s)")

    def fail(self, name: str, error: str):
        self.failed += 1
        self.errors.append(f"{name}: {error}")
        print(f"  FAIL  {name}: {error}")

    def summary(self):
        total = self.passed + self.failed
        print(f"\n{'=' * 50}")
        print(f"{self.passed}/{total} passed, {self.failed} failed")
        if self.errors:
            print("\nFailures:")
            for e in self.errors:
                print(f"  - {e}")
        return self.failed == 0


def _to_stored_key_shares(key_shares: list[ServerKeyShare]) -> list[StoredKeyShare]:
    return [
        StoredKeyShare(key_share_id=ks.key_share_id, secret_share=ks.secret_share)
        for ks in key_shares
    ]


def _to_server_key_shares(stored: list[StoredKeyShare]) -> list[ServerKeyShare]:
    return [
        ServerKeyShare(key_share_id=ks.key_share_id, secret_share=ks.secret_share)
        for ks in stored
    ]


class WalletFileGuard:
    """Context manager that backs up and restores .wallets.json."""

    def __enter__(self):
        self._backup_path = WALLET_FILE.with_suffix(".json.bak")
        self._had_file = WALLET_FILE.exists()
        if self._had_file:
            self._original = WALLET_FILE.read_text()
            WALLET_FILE.rename(self._backup_path)
        return self

    def __exit__(self, *args):
        if WALLET_FILE.exists():
            WALLET_FILE.unlink()
        if self._backup_path.exists():
            self._backup_path.rename(WALLET_FILE)


# ---------------------------------------------------------------------------
# EVM Tests
# ---------------------------------------------------------------------------

async def test_evm_create_and_sign(t: SmokeTest):
    """Create wallet, sign message, verify signature, sign typed data, sign tx."""
    print("\nEVM: Create and Sign")
    print("-" * 30)

    async with await authenticated_evm_client() as client:
        # Create wallet
        try:
            start = time.time()
            wallet = await client.create_wallet_account()
            address = wallet.account_address
            wallet_id = wallet.wallet_id
            key_shares = wallet.external_server_key_shares
            assert address.startswith("0x"), f"Bad address: {address}"
            assert wallet_id, "No wallet_id"
            assert len(key_shares) > 0, "No key shares"
            t.ok("create_wallet_account", time.time() - start)
        except Exception as e:
            t.fail("create_wallet_account", str(e))
            return None, None, None

        # Sign message
        message = "smoke-test-message"
        try:
            start = time.time()
            signature = await client.sign_message(
                message=message, address=address, key_shares=key_shares,
            )
            assert signature.startswith("0x") and len(signature) == 132
            t.ok("sign_message", time.time() - start)
        except Exception as e:
            t.fail("sign_message", str(e))
            return address, wallet_id, key_shares

        # Verify signature off-chain
        try:
            start = time.time()
            msg = encode_defunct(text=message)
            recovered = Account.recover_message(msg, signature=signature)
            assert recovered.lower() == address.lower(), f"Recovered {recovered} != {address}"
            t.ok("verify_signature", time.time() - start)
        except Exception as e:
            t.fail("verify_signature", str(e))

        # Sign typed data
        try:
            start = time.time()
            typed_data = {
                "types": {
                    "EIP712Domain": [{"name": "name", "type": "string"}],
                    "Test": [{"name": "value", "type": "string"}],
                },
                "primaryType": "Test",
                "domain": {"name": "SmokeTest"},
                "message": {"value": "hello"},
            }
            sig = await client.sign_typed_data(address, typed_data, key_shares=key_shares)
            assert sig.startswith("0x")
            t.ok("sign_typed_data", time.time() - start)
        except Exception as e:
            t.fail("sign_typed_data", str(e))

        # Sign transaction (legacy)
        try:
            start = time.time()
            tx = {
                "to": "0x0000000000000000000000000000000000000000",
                "value": 0, "nonce": 0, "gas": 21000,
                "gasPrice": 1000000000, "chainId": 84532, "data": "0x",
            }
            signed = await client.sign_transaction(address=address, tx=tx, key_shares=key_shares)
            assert signed.startswith("0x")
            t.ok("sign_transaction", time.time() - start)
        except Exception as e:
            t.fail("sign_transaction", str(e))

        return address, wallet_id, key_shares


async def test_evm_storage_roundtrip(t: SmokeTest, address: str, wallet_id: str, key_shares):
    """Save wallet to storage, load in new session, sign, delete."""
    print("\nEVM: Storage Roundtrip")
    print("-" * 30)

    if not address:
        t.fail("storage_roundtrip", "Skipped - no wallet from previous step")
        return

    with WalletFileGuard():
        # Save wallet
        try:
            start = time.time()
            save_wallet(StoredWallet(
                address=address,
                wallet_id=wallet_id,
                chain="evm",
                created_at="2026-01-01T00:00:00Z",
                key_shares=_to_stored_key_shares(key_shares),
            ))
            assert WALLET_FILE.exists(), ".wallets.json not created"
            t.ok("save_wallet", time.time() - start)
        except Exception as e:
            t.fail("save_wallet", str(e))
            return

        # Load wallet back
        try:
            start = time.time()
            loaded = get_wallet(address)
            assert loaded is not None, "Wallet not found after save"
            assert loaded.address == address
            assert loaded.wallet_id == wallet_id
            assert len(loaded.key_shares) > 0, "No key shares in loaded wallet"
            assert loaded.key_shares[0].secret_share == key_shares[0].secret_share
            t.ok("get_wallet", time.time() - start)
        except Exception as e:
            t.fail("get_wallet", str(e))

        # List wallets
        try:
            start = time.time()
            wallets = list_wallets()
            assert any(w.address == address for w in wallets), "Wallet not in list"
            t.ok("list_wallets", time.time() - start)
        except Exception as e:
            t.fail("list_wallets", str(e))

        # New client session: load_wallet + sign with stored key shares
        try:
            start = time.time()
            stored = get_wallet(address)
            stored_shares = _to_server_key_shares(stored.key_shares)
            async with await authenticated_evm_client() as client2:
                await client2.load_wallet(address)
                sig = await client2.sign_message(
                    message="new-session-test", address=address, key_shares=stored_shares,
                )
                assert sig.startswith("0x")
            t.ok("new_session: load_wallet + sign", time.time() - start)
        except Exception as e:
            t.fail("new_session: load_wallet + sign", str(e))

        # Delete wallet
        try:
            start = time.time()
            assert delete_wallet(address), "Delete returned False"
            assert get_wallet(address) is None, "Wallet still exists after delete"
            t.ok("delete_wallet", time.time() - start)
        except Exception as e:
            t.fail("delete_wallet", str(e))


async def test_evm_password_wallet(t: SmokeTest):
    """Create wallet with password, save without key shares (backup mode), verify password required."""
    print("\nEVM: Password / Backup Flow")
    print("-" * 30)

    password = "smoke-test-password-123"

    async with await authenticated_evm_client() as client:
        # Create wallet with password
        try:
            start = time.time()
            wallet = await client.create_wallet_account(password=password)
            address = wallet.account_address
            wallet_id = wallet.wallet_id
            key_shares = wallet.external_server_key_shares
            assert address.startswith("0x")
            t.ok("create_wallet_account (with password)", time.time() - start)
        except Exception as e:
            t.fail("create_wallet_account (with password)", str(e))
            return

        # Sign with password-created wallet (key shares still in memory)
        try:
            start = time.time()
            sig = await client.sign_message(
                message="password-test", address=address, key_shares=key_shares,
            )
            assert sig.startswith("0x")
            t.ok("sign_message (same session, with shares)", time.time() - start)
        except Exception as e:
            t.fail("sign_message (same session, with shares)", str(e))

    with WalletFileGuard():
        # Save wallet WITHOUT key shares (backup mode)
        try:
            start = time.time()
            save_wallet(StoredWallet(
                address=address,
                wallet_id=wallet_id,
                chain="evm",
                created_at="2026-01-01T00:00:00Z",
                key_shares=[],
            ))
            loaded = get_wallet(address)
            assert loaded is not None
            assert len(loaded.key_shares) == 0, "Key shares should be empty in backup mode"
            t.ok("save_wallet (backup mode, no shares)", time.time() - start)
        except Exception as e:
            t.fail("save_wallet (backup mode, no shares)", str(e))

        # Verify: wallet_helpers requires password when shares are empty
        try:
            start = time.time()
            async with await authenticated_evm_client() as client3:
                try:
                    await get_or_create_evm_wallet(client3, address=address, password=None)
                    t.fail("no_password_rejected", "Should have raised SystemExit")
                except SystemExit:
                    t.ok("no_password_rejected", time.time() - start)
        except Exception as e:
            t.fail("no_password_rejected", str(e))

        # Save wallet WITH key shares (local mode) — verify signing works without password
        try:
            start = time.time()
            save_wallet(StoredWallet(
                address=address,
                wallet_id=wallet_id,
                chain="evm",
                created_at="2026-01-01T00:00:00Z",
                key_shares=_to_stored_key_shares(key_shares),
            ))
            async with await authenticated_evm_client() as client4:
                addr, shares = await get_or_create_evm_wallet(client4, address=address)
                sig = await client4.sign_message(
                    message="local-shares-no-password",
                    address=addr,
                    key_shares=shares,
                )
                assert sig.startswith("0x")
            t.ok("sign_with_local_shares (no password)", time.time() - start)
        except Exception as e:
            t.fail("sign_with_local_shares (no password)", str(e))


async def test_evm_threshold_schemes(t: SmokeTest):
    """Create wallets with different threshold schemes and sign."""
    print("\nEVM: Threshold Schemes")
    print("-" * 30)

    for scheme in [ThresholdSignatureScheme.TWO_OF_TWO, ThresholdSignatureScheme.TWO_OF_THREE]:
        try:
            start = time.time()
            async with await authenticated_evm_client() as client:
                wallet = await client.create_wallet_account(threshold_signature_scheme=scheme)
                sig = await client.sign_message(
                    message=f"threshold-test-{scheme.value}",
                    address=wallet.account_address,
                    key_shares=wallet.external_server_key_shares,
                )
                assert sig.startswith("0x")
            t.ok(f"create + sign ({scheme.value})", time.time() - start)
        except Exception as e:
            t.fail(f"create + sign ({scheme.value})", str(e))


# ---------------------------------------------------------------------------
# SVM Tests
# ---------------------------------------------------------------------------

async def test_svm_create_and_sign(t: SmokeTest):
    """Create wallet, sign message, sign transaction."""
    print("\nSVM: Create and Sign")
    print("-" * 30)

    async with await authenticated_svm_client() as client:
        # Create wallet
        try:
            start = time.time()
            wallet = await client.create_wallet_account()
            address = wallet.account_address
            wallet_id = wallet.wallet_id
            key_shares = wallet.external_server_key_shares
            assert address, "No address"
            assert len(key_shares) > 0, "No key shares"
            t.ok("create_wallet_account", time.time() - start)
        except Exception as e:
            t.fail("create_wallet_account", str(e))
            return None, None, None

        # Sign message
        try:
            start = time.time()
            signature = await client.sign_message(
                message="smoke-test-solana", address=address, key_shares=key_shares,
            )
            assert signature, "No signature"
            t.ok("sign_message", time.time() - start)
        except Exception as e:
            t.fail("sign_message", str(e))

        # Sign transaction (minimal message bytes)
        try:
            start = time.time()
            from solders.hash import Hash
            from solders.message import Message
            from solders.pubkey import Pubkey
            from solders.system_program import TransferParams, transfer

            from_pubkey = Pubkey.from_string(address)
            ix = transfer(TransferParams(
                from_pubkey=from_pubkey,
                to_pubkey=from_pubkey,
                lamports=0,
            ))
            msg = Message.new_with_blockhash(
                [ix],
                from_pubkey,
                Hash.default(),  # Dummy blockhash for sign-only test
            )
            sig_hex = await client.sign_transaction(
                address=address,
                message_bytes=bytes(msg),
                key_shares=key_shares,
            )
            assert sig_hex, "No transaction signature"
            t.ok("sign_transaction", time.time() - start)
        except Exception as e:
            t.fail("sign_transaction", str(e))

        return address, wallet_id, key_shares


async def test_svm_storage_roundtrip(t: SmokeTest, address: str, wallet_id: str, key_shares):
    """Save SVM wallet, load in new session, sign."""
    print("\nSVM: Storage Roundtrip")
    print("-" * 30)

    if not address:
        t.fail("storage_roundtrip", "Skipped - no wallet from previous step")
        return

    with WalletFileGuard():
        # Save wallet
        try:
            start = time.time()
            save_wallet(StoredWallet(
                address=address,
                wallet_id=wallet_id,
                chain="svm",
                created_at="2026-01-01T00:00:00Z",
                key_shares=_to_stored_key_shares(key_shares),
            ))
            loaded = get_wallet(address)
            assert loaded is not None
            assert loaded.chain == "svm"
            t.ok("save_wallet", time.time() - start)
        except Exception as e:
            t.fail("save_wallet", str(e))
            return

        # New session: load_wallet + sign with stored key shares
        try:
            start = time.time()
            stored = get_wallet(address)
            stored_shares = _to_server_key_shares(stored.key_shares)
            async with await authenticated_svm_client() as client2:
                await client2.load_wallet(address)
                sig = await client2.sign_message(
                    message="new-session-svm", address=address, key_shares=stored_shares,
                )
                assert sig, "No signature in new session"
            t.ok("new_session: load_wallet + sign", time.time() - start)
        except Exception as e:
            t.fail("new_session: load_wallet + sign", str(e))

        # Delete wallet
        try:
            start = time.time()
            assert delete_wallet(address), "Delete returned False"
            assert get_wallet(address) is None, "Wallet still exists after delete"
            t.ok("delete_wallet", time.time() - start)
        except Exception as e:
            t.fail("delete_wallet", str(e))


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

async def main(include_svm: bool = False):
    print("Dynamic Python SDK Smoke Test")
    print(f"Environment: {DYNAMIC_ENV_ID[:8]}...")
    print("=" * 50)

    t = SmokeTest()

    address, wallet_id, key_shares = await test_evm_create_and_sign(t)
    await test_evm_storage_roundtrip(t, address, wallet_id, key_shares)
    await test_evm_password_wallet(t)
    await test_evm_threshold_schemes(t)

    if include_svm:
        address, wallet_id, key_shares = await test_svm_create_and_sign(t)
        await test_svm_storage_roundtrip(t, address, wallet_id, key_shares)

    success = t.summary()
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Dynamic Python SDK Smoke Test")
    parser.add_argument("--svm", action="store_true", help="Also test Solana wallets")
    args = parser.parse_args()

    asyncio.run(main(include_svm=args.svm))

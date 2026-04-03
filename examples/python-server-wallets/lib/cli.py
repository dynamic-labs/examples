"""
CLI Utilities

Shared helpers for command-line scripts to reduce boilerplate
and standardize execution across all demos.
"""

import asyncio
import sys
import traceback

from dynamic_wallet_sdk.exceptions import WalletNotFoundError, DynamicSDKError


def run_script(fn):
    """
    Wrapper to eliminate duplicated main() boilerplate.
    Handles asyncio event loop, try/catch, and sys.exit() consistently.

    Usage:
        def main():
            run_script(my_async_function)
    """
    try:
        asyncio.run(fn())
    except KeyboardInterrupt:
        print("\nInterrupted.")
        sys.exit(1)
    except WalletNotFoundError as e:
        print(f"\nWallet not found: {e}", file=sys.stderr)
        print(
            "\nThis usually means the wallet's key shares aren't loaded in this session.",
            file=sys.stderr,
        )
        print("Possible fixes:", file=sys.stderr)
        print("  - Add --password YOUR_PASSWORD to recover key shares from backup", file=sys.stderr)
        print("  - Omit --address to create a new ephemeral wallet", file=sys.stderr)
        print("  - Verify the wallet exists: python -m server_wallet.wallet --list", file=sys.stderr)
        sys.exit(1)
    except DynamicSDKError as e:
        print(f"\nDynamic SDK error: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        traceback.print_exc()
        sys.exit(1)

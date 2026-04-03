"""
Formatting Utilities
"""

from .config import EXPLORER_BASE_URL


def format_address(address: str) -> str:
    """Truncate an address for display."""
    return f"{address[:8]}...{address[-6:]}"


def get_transaction_link(tx_hash: str) -> str:
    """Generate a block explorer link for a transaction hash."""
    return f"{EXPLORER_BASE_URL}/tx/{tx_hash}"


def get_address_link(address: str) -> str:
    """Generate a block explorer link for an address."""
    return f"{EXPLORER_BASE_URL}/address/{address}"

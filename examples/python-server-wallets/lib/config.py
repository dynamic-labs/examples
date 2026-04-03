"""
Centralized Configuration

All configuration constants in one place.
Loads environment variables from .env file.
"""

import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

DYNAMIC_API_TOKEN = os.environ.get("DYNAMIC_API_TOKEN", "")
DYNAMIC_ENV_ID = os.environ.get("DYNAMIC_ENV_ID", "")

# RPC URLs (from environment)
EVM_RPC_URL = os.environ.get("EVM_RPC_URL", "")
SOLANA_RPC_URL = os.environ.get("SOLANA_RPC_URL", "")

# Base Sepolia (chain ID 84532)
BASE_SEPOLIA_CHAIN_ID = 84532
EXPLORER_BASE_URL = "https://sepolia.basescan.org"

# EVM RPC URLs by chain ID (used by send_transaction)
EVM_RPC_URLS: dict[int, str] = {}
if EVM_RPC_URL:
    EVM_RPC_URLS[BASE_SEPOLIA_CHAIN_ID] = EVM_RPC_URL

"""
Dynamic SDK Client Factories

Provides helper functions to create and authenticate Dynamic SDK clients.
"""

from dynamic_wallet_sdk import ThresholdSignatureScheme
from dynamic_wallet_sdk.evm.client import DynamicEvmWalletClient
from dynamic_wallet_sdk.svm.client import DynamicSvmWalletClient
from dynamic_wallet_sdk.delegated.client import (
    create_delegated_evm_client,
    delegated_sign_message,
)
from dynamic_wallet_sdk.delegated.decrypt import decrypt_delegated_webhook_data

from .config import DYNAMIC_API_TOKEN, DYNAMIC_ENV_ID, EVM_RPC_URLS, SOLANA_RPC_URL


async def authenticated_evm_client(
    environment_id: str | None = None,
    auth_token: str | None = None,
    rpc_urls: dict[int, str] | None = None,
) -> DynamicEvmWalletClient:
    """Create and authenticate an EVM wallet client."""
    env_id = environment_id or DYNAMIC_ENV_ID
    token = auth_token or DYNAMIC_API_TOKEN

    client = DynamicEvmWalletClient(env_id, rpc_urls=rpc_urls or EVM_RPC_URLS)
    await client.authenticate_api_token(token)
    return client


async def authenticated_svm_client(
    environment_id: str | None = None,
    auth_token: str | None = None,
    default_rpc_url: str | None = None,
) -> DynamicSvmWalletClient:
    """Create and authenticate an SVM (Solana) wallet client."""
    env_id = environment_id or DYNAMIC_ENV_ID
    token = auth_token or DYNAMIC_API_TOKEN

    client = DynamicSvmWalletClient(env_id, default_rpc_url=default_rpc_url or SOLANA_RPC_URL or None)
    await client.authenticate_api_token(token)
    return client


async def delegated_evm_client(
    environment_id: str | None = None,
    api_key: str | None = None,
) -> DynamicEvmWalletClient:
    """Create a delegated EVM wallet client."""
    env_id = environment_id or DYNAMIC_ENV_ID
    key = api_key or DYNAMIC_API_TOKEN

    return await create_delegated_evm_client(env_id, key)


__all__ = [
    "ThresholdSignatureScheme",
    "authenticated_evm_client",
    "authenticated_svm_client",
    "delegated_evm_client",
    "delegated_sign_message",
    "decrypt_delegated_webhook_data",
]

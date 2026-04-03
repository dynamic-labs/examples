"""
Delegated Webhook Decryption Demo

Decrypt delegation webhook data received from Dynamic when a user
grants your application delegated access to their wallet.

## How Delegation Works

1. User initiates delegation through your frontend application
2. Dynamic sends a webhook to your server with encrypted credentials
3. You decrypt the webhook payload using your RSA private key
4. The decrypted data contains the delegated key share and API key
5. Store these credentials securely for future signing operations

## Usage

  python -m server_wallet.delegated.decrypt_webhook

This demo shows the API usage. In production, you would:
- Receive the encrypted data from Dynamic's webhook
- Use your RSA private key to decrypt it
- Store the decrypted credentials securely
"""

from dynamic_wallet_sdk.delegated.decrypt import decrypt_delegated_webhook_data

from lib.cli import run_script


async def decrypt_webhook():
    print("Delegated Webhook Decryption Demo")
    print("=" * 50)
    print()

    # In production, these values come from Dynamic's webhook payload
    # and your securely stored RSA private key.
    #
    # Example usage:
    #
    #   from dynamic_wallet_sdk.delegated.decrypt import decrypt_delegated_webhook_data
    #
    #   result = decrypt_delegated_webhook_data(
    #       private_key_pem=your_rsa_private_key,  # str or bytes, PEM format
    #       encrypted_delegated_key_share=webhook_data["encryptedKeyShare"],
    #       encrypted_wallet_api_key=webhook_data["encryptedApiKey"],
    #   )
    #
    #   # Access decrypted values:
    #   wallet_api_key = result.decrypted_wallet_api_key
    #   secret_share = result.decrypted_delegated_share["secretShare"]
    #
    #   # Store these securely for use with delegated_sign_message():
    #   save_to_secure_storage({
    #       "walletId": webhook_data["walletId"],
    #       "walletApiKey": wallet_api_key,
    #       "delegatedShare": secret_share,
    #   })

    print("decrypt_delegated_webhook_data() parameters:")
    print("  - private_key_pem: Your RSA private key (str or bytes, PEM format)")
    print("  - encrypted_delegated_key_share: From webhook payload")
    print("  - encrypted_wallet_api_key: From webhook payload")
    print()
    print("Returns an object with:")
    print("  - .decrypted_wallet_api_key: API key for delegated operations")
    print("  - .decrypted_delegated_share: Dict with 'secretShare' key")
    print()
    print("Security requirements:")
    print("  - Store all credentials encrypted at rest")
    print("  - Never log delegation materials")
    print("  - RSA private key must remain server-side only")
    print("  - Protect server API key using environment variables")


def main():
    run_script(decrypt_webhook)


if __name__ == "__main__":
    main()

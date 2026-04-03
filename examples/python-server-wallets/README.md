# Dynamic Python Server-Side Wallet Management

Server-side wallet management examples using Dynamic's Python SDK. Demonstrates wallet creation, message signing, transaction signing, typed data signing, key recovery, Solana wallet support, and delegated wallet operations.

## Project Structure

```
server_wallet/
├── evm/                          # EVM server wallet operations
│   ├── wallet.py                 # Create, list, delete wallets
│   ├── sign_message.py           # Sign messages for authentication
│   ├── sign_transaction.py       # Sign EVM transactions
│   ├── send_transaction.py       # Sign and broadcast EVM transactions
│   ├── sign_typed_data.py        # Sign EIP-712 structured data
│   └── recover_key_shares.py     # Recover key shares with password
│
├── svm/                          # Solana (SVM) server wallet operations
│   ├── wallet.py                 # Create, list, delete Solana wallets
│   ├── sign_message.py           # Sign messages with Ed25519
│   ├── sign_transaction.py       # Sign Solana transactions
│   └── send_transaction.py       # Sign and broadcast Solana transactions
│
└── delegated/                    # Delegated wallet operations
    ├── sign_message.py           # Sign messages with delegated access
    ├── decrypt_webhook.py        # Decrypt delegation webhook data
    ├── wallet.json.example       # Template for delegated credentials
    └── README.md                 # Prerequisites and setup guide

lib/                              # Shared utilities
├── cli.py                        # CLI helpers (run_script)
├── config.py                     # Centralized configuration
├── dynamic.py                    # Dynamic client factories
├── utils.py                      # Formatting utilities
├── wallet_helpers.py             # Wallet retrieval helpers
└── wallet_storage.py             # Local JSON storage (dev only)
```

## What You'll Learn

### EVM Server Wallet Operations (`server_wallet/evm/`)

- Create ephemeral or persistent server-side wallets with configurable threshold schemes
- Optional key share backup to Dynamic (requires password to recover and sign)
- Local key share storage for direct signing (no password needed)
- Sign messages (EIP-191) for authentication
- Sign transactions (legacy)
- Send transactions (sign and broadcast in one call)
- Sign typed data (EIP-712) for permits and meta-transactions
- Recover key shares from password-protected backups

### Solana Server Wallet Operations (`server_wallet/svm/`)

- Create Solana wallets with Ed25519 key pairs
- Sign messages with Ed25519 signatures (base58-encoded)
- Sign transactions for manual broadcasting via solders/solana-py
- Send transactions (sign and broadcast in one call)
- Same persistence and threshold scheme patterns as EVM

### Delegated Wallet Operations (`server_wallet/delegated/`)

- Sign messages on behalf of users who granted delegation access
- Decrypt webhook data received during the delegation flow
- Understand the delegation credential lifecycle

## Security Features

- **MPC threshold signatures**: Distributed key management (TSS-MPC architecture)
- **Configurable threshold schemes**: TWO_OF_TWO or TWO_OF_THREE
- **Password-protected backups**: AES-256-GCM encrypted key shares backed up to Dynamic
- **Local key share storage**: Alternative to backup for direct signing without password

## Technical Stack

- **[Dynamic Python SDK](https://pypi.org/project/dynamic-wallet-sdk/)**: Server-side wallet creation and signing
- **Python 3.11+**: Async/await with native type hints
- **Rust core**: Performance-critical MPC operations via native extension

## Prerequisites

- Python 3.11 - 3.13
- Dynamic API credentials ([app.dynamic.xyz](https://app.dynamic.xyz/))

## Setup

1. **Create a virtual environment and install dependencies**:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # or .venv\Scripts\activate on Windows
   pip install -e .
   ```
2. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```
   Required variables:
   ```
   DYNAMIC_API_TOKEN=your_dynamic_api_token
   DYNAMIC_ENV_ID=your_environment_id
   ```

## Running the Examples

### EVM Wallet Management

```bash
# Create ephemeral wallet (not saved)
python -m server_wallet.evm.wallet --create

# Create and save wallet (key shares stored locally)
python -m server_wallet.evm.wallet --create --save

# Create with 2-of-3 threshold scheme
python -m server_wallet.evm.wallet --create --save --threshold 3

# Create with key shares backed up to Dynamic (requires password to sign)
python -m server_wallet.evm.wallet --create --save --backup --password password

# List all saved wallets
python -m server_wallet.evm.wallet --list

# Delete a saved wallet
python -m server_wallet.evm.wallet --delete 0x123...
```

### EVM Message Signing

```bash
# Sign with new ephemeral wallet
python -m server_wallet.evm.sign_message "Hello, World"

# Sign with saved wallet (local key shares)
python -m server_wallet.evm.sign_message "Hello, World" --address 0x123...

# Sign with backed-up wallet (recovers key shares from Dynamic)
python -m server_wallet.evm.sign_message "Hello, World" --address 0x123... --password password
```

### EVM Transaction Signing

```bash
# Sign a transaction with new wallet
python -m server_wallet.evm.sign_transaction

# Sign with saved wallet
python -m server_wallet.evm.sign_transaction --address 0x123...

# Sign with backed-up wallet
python -m server_wallet.evm.sign_transaction --address 0x123... --password password
```

### EVM Typed Data Signing (EIP-712)

```bash
# Sign typed data with new wallet
python -m server_wallet.evm.sign_typed_data

# Sign with saved wallet
python -m server_wallet.evm.sign_typed_data --address 0x123...

# Sign with backed-up wallet
python -m server_wallet.evm.sign_typed_data --address 0x123... --password password
```

### EVM Send Transaction (Sign + Broadcast)

```bash
# Send a transaction with new wallet
python -m server_wallet.evm.send_transaction

# Send with saved wallet
python -m server_wallet.evm.send_transaction --address 0x123...

# Send with backed-up wallet
python -m server_wallet.evm.send_transaction --address 0x123... --password password
```

### EVM Key Share Recovery

```bash
# Recover key shares for a backed-up wallet
python -m server_wallet.evm.recover_key_shares --address 0x123... --password password
```

### Solana Wallet Management

```bash
# Create Solana wallet (not saved)
python -m server_wallet.svm.wallet --create

# Create and save wallet (key shares stored locally)
python -m server_wallet.svm.wallet --create --save

# Create with 2-of-3 threshold
python -m server_wallet.svm.wallet --create --save --threshold 3

# Create with key shares backed up to Dynamic (requires password to sign)
python -m server_wallet.svm.wallet --create --save --backup --password password

# List saved Solana wallets
python -m server_wallet.svm.wallet --list

# Delete a saved wallet
python -m server_wallet.svm.wallet --delete <address>
```

### Solana Message Signing

```bash
# Sign with new Solana wallet
python -m server_wallet.svm.sign_message "Hello, Solana"

# Sign with saved wallet
python -m server_wallet.svm.sign_message "Hello, Solana" --address <address>

# Sign with backed-up wallet
python -m server_wallet.svm.sign_message "Hello, Solana" --address <address> --password password
```

### Solana Transaction Signing

```bash
# Sign a Solana transaction with new wallet
python -m server_wallet.svm.sign_transaction

# Sign with saved wallet
python -m server_wallet.svm.sign_transaction --address <address>

# Sign with backed-up wallet
python -m server_wallet.svm.sign_transaction --address <address> --password password
```

### Solana Send Transaction (Sign + Broadcast)

```bash
# Send a Solana transaction with new wallet
python -m server_wallet.svm.send_transaction

# Send with saved wallet
python -m server_wallet.svm.send_transaction --address <address>

# Send with backed-up wallet
python -m server_wallet.svm.send_transaction --address <address> --password password
```

### Delegated Wallet Operations

> Requires `server_wallet/delegated/wallet.json` with delegated credentials.
> See `server_wallet/delegated/README.md` for setup instructions.

```bash
# Sign message with delegated wallet
python -m server_wallet.delegated.sign_message "Hello, World"

# Decrypt webhook data (demo)
python -m server_wallet.delegated.decrypt_webhook
```

### Smoke Test

```bash
# Run EVM smoke tests
python smoke_test.py

# Run EVM + Solana smoke tests
python smoke_test.py --svm
```

## Sample Output

### Wallet Creation

```
Creating server wallet (TWO_OF_TWO)...
Server wallet created in 2.34s
Address: 0x7E3629...5A02f0
Wallet ID: a1b2c3d4-e5f6-7890-abcd-ef1234567890
Wallet saved to .wallets.json
```

### Message Signing

```
Signing message...

Message signed in 1.45s
Message: "Hello, World"
Signature: 0xabc123...def456
Signer: 0x7E3629...5A02f0
```

### Send Transaction

```
Sending EVM transaction...

Transaction sent in 2.10s
Hash: 0x789abc...def012
Explorer: https://sepolia.basescan.org/tx/0x789abc...def012
Wallet: 0x7E3629...5A02f0
```

## SDK API Coverage

This example covers all methods in the Dynamic Python SDK:

| Method                           | Example                                      |
| -------------------------------- | -------------------------------------------- |
| `authenticate_api_token`         | All scripts (via `lib/dynamic.py`)           |
| `create_wallet_account` (EVM)    | `server_wallet/evm/wallet.py`                |
| `load_wallet`                    | `lib/wallet_helpers.py`                      |
| `sign_message` (EVM)             | `server_wallet/evm/sign_message.py`          |
| `sign_transaction` (EVM)         | `server_wallet/evm/sign_transaction.py`      |
| `send_transaction` (EVM)         | `server_wallet/evm/send_transaction.py`      |
| `sign_typed_data`                | `server_wallet/evm/sign_typed_data.py`       |
| `recover_key_shares`             | `server_wallet/evm/recover_key_shares.py`    |
| `create_wallet_account` (SVM)    | `server_wallet/svm/wallet.py`                |
| `sign_message` (SVM)             | `server_wallet/svm/sign_message.py`          |
| `sign_transaction` (SVM)         | `server_wallet/svm/sign_transaction.py`      |
| `send_transaction` (SVM)         | `server_wallet/svm/send_transaction.py`      |
| `create_delegated_evm_client`    | `server_wallet/delegated/sign_message.py`    |
| `delegated_sign_message`         | `server_wallet/delegated/sign_message.py`    |
| `decrypt_delegated_webhook_data` | `server_wallet/delegated/decrypt_webhook.py` |

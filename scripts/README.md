# Scripts Directory

**For internal use only**

This directory contains automation scripts for maintaining and managing the Dynamic Examples Repository.

## 📋 **Available Scripts**

### **`for-all-examples.sh`**

**Purpose**: Execute commands across all examples and starter kits in the repository.

**Location**: `scripts/for-all-examples.sh`

#### **Usage**

```bash
# Basic usage - run command in all examples
./scripts/for-all-examples.sh <command> [args...]

# Run command with shell -c (for complex commands)
./scripts/for-all-examples.sh -c "<shell-command>"

# Quiet mode (don't print directory names)
./scripts/for-all-examples.sh -q <command>

# Force mode (continue even after errors)
./scripts/for-all-examples.sh -f <command>

# Combined options
./scripts/for-all-examples.sh -qf <command>
```

#### **Examples**

```bash
# Install dependencies for all examples
./scripts/for-all-examples.sh pnpm install

# Build all examples
./scripts/for-all-examples.sh pnpm build

# Update all examples
./scripts/for-all-examples.sh pnpm update

# Clean build artifacts
./scripts/for-all-examples.sh rm -rf .next out dist

# Run linting across all examples
./scripts/for-all-examples.sh pnpm lint

# Install dependencies quietly
./scripts/for-all-examples.sh -q pnpm install

# Continue building even if some examples fail
./scripts/for-all-examples.sh -f pnpm build
```

#### **Options**

- `-q, --quiet`: Don't print the current directory being processed
- `-f, --force`: Continue execution even after an error occurs
- `-c, --command`: Run command with `sh -c` instead of direct execution
- `-h, --help`: Show usage information

#### **How it Works**

1. Finds all directories under `examples/` and `starter-kits/`
2. Changes into each directory
3. Executes the specified command
4. Reports progress and any errors

---

### **`update-dynamic-packages.sh`**

**Purpose**: Update Dynamic Labs packages across all examples and starter kits to a specific version.

**Location**: `scripts/update-dynamic-packages.sh`

#### **Usage**

```bash
# Update to latest version
./scripts/update-dynamic-packages.sh

# Update to specific version
./scripts/update-dynamic-packages.sh 1.2.3

# Show help
./scripts/update-dynamic-packages.sh -h
```

#### **Examples**

```bash
# Update all examples to latest Dynamic packages
./scripts/update-dynamic-packages.sh

# Update to specific version
./scripts/update-dynamic-packages.sh 3.33.0

```

#### **Options**

- `<version>`: Specific version to update to (optional, defaults to "latest")
- `-h, --help`: Show usage information

#### **Supported Package Managers**

- **pnpm** (preferred)
- **npm**

#### **What it Updates**

Updates all `@dynamic-labs/*` packages except:

- `@dynamic-labs/sdk-api-core` (different versioning scheme)
- Dependencies pinned to `"*"` (explicitly skipped)

#### **How it Works**

1. Scans all projects in `examples/` and `starter-kits/`
2. Detects the package manager used in each project
3. Identifies Dynamic Labs dependencies to update
4. Updates all found dependencies to the specified version
5. Reports progress for each project

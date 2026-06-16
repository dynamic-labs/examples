import type { Signer } from "@linera/client";
import type { EvmWalletAccount } from "@dynamic-labs-sdk/evm";
import { createWalletClientForWalletAccount } from "@dynamic-labs-sdk/evm/viem";

export class DynamicSigner implements Signer {
  private dynamicWallet: EvmWalletAccount;

  constructor(dynamicWallet: EvmWalletAccount) {
    this.dynamicWallet = dynamicWallet;
  }

  async address(): Promise<string> {
    return this.dynamicWallet.address;
  }

  async containsKey(owner: string): Promise<boolean> {
    const walletAddress = this.dynamicWallet.address;
    return owner.toLowerCase() === walletAddress.toLowerCase();
  }

  async sign(owner: string, value: Uint8Array): Promise<string> {
    const address: `0x${string}` = owner as `0x${string}`;
    const primaryWallet = this.dynamicWallet.address;

    if (!primaryWallet || !owner) {
      throw new Error("No primary wallet found");
    }

    if (owner.toLowerCase() !== primaryWallet.toLowerCase()) {
      throw new Error("Owner does not match primary wallet");
    }

    try {
      const msgHex: `0x${string}` = `0x${uint8ArrayToHex(value)}`;

      // IMPORTANT: The value parameter is already pre-hashed, and the standard `signMessage`
      // method would hash it again, resulting in a double-hash. To avoid this, we bypass
      // the standard signing flow and use `personal_sign` directly on the wallet client.
      // DO NOT USE: this.dynamicWallet.signMessage(msgHex) - it would cause double-hashing

      const walletClient = await createWalletClientForWalletAccount({
        walletAccount: this.dynamicWallet,
      });
      const signature = await walletClient.request({
        method: "personal_sign",
        params: [msgHex, address],
      });

      if (!signature) throw new Error("Failed to sign message");
      return signature;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Failed to sign message:", error);
      throw new Error(
        `Dynamic signature request failed: ${error?.message || error}`
      );
    }
  }
}

function uint8ArrayToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b: number) => b.toString(16).padStart(2, "0"))
    .join("");
}

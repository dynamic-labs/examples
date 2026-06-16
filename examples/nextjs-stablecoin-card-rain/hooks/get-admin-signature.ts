import { type WalletClient } from "viem";
import { randomBytes } from "crypto";

type AdminSignatureOpts = {
  walletClient: WalletClient;
  signerAddress: string;
  chainId: number;
  collateralProxyAddress: string;
  recipientAddress: string;
  amount: number | bigint;
  tokenAddress: string;
  nonce: number | bigint;
};

/**
 * Gets admin signature needed to resolve on coordinator contract
 * @param opts
 * @returns
 */
export const getAdminSignature = async (opts: AdminSignatureOpts) => {
  const {
    walletClient,
    signerAddress,
    collateralProxyAddress,
    chainId,
    tokenAddress,
    amount,
    recipientAddress,
    nonce,
  } = opts;

  const salt = `0x${randomBytes(32).toString("hex")}` as `0x${string}`;
  const domain = {
    name: "Collateral",
    version: "2",
    chainId: chainId,
    verifyingContract: collateralProxyAddress as `0x${string}`,
    salt,
  };
  const type = {
    Withdraw: [
      { name: "user", type: "address" },
      { name: "asset", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "recipient", type: "address" },
      { name: "nonce", type: "uint256" },
    ],
  };

  const message = {
    user: signerAddress as `0x${string}`,
    asset: tokenAddress as `0x${string}`,
    amount,
    recipient: recipientAddress as `0x${string}`,
    nonce,
  };

  const signature = await walletClient.signTypedData({
    account: signerAddress as `0x${string}`,
    primaryType: "Withdraw",
    domain,
    types: type,
    message,
  });

  return { salt, signature } as const;
};

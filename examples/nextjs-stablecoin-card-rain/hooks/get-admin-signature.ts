import { isEthereumWallet } from "@dynamic-labs/ethereum";
import { randomBytes } from "crypto";

type AdminSignatureOpts = {
  primaryWallet: any;
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
    primaryWallet,
    collateralProxyAddress,
    chainId,
    tokenAddress,
    amount,
    recipientAddress,
    nonce,
  } = opts;

  if (!primaryWallet || !isEthereumWallet(primaryWallet)) {
    throw new Error("Wallet not connected or not EVM compatible");
  }

  const walletClient = await primaryWallet.getWalletClient();

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
  const signerAddress = primaryWallet.address;

  const message = {
    user: signerAddress,
    asset: tokenAddress,
    amount,
    recipient: recipientAddress,
    nonce,
  };

  const signature = await walletClient.signTypedData({
    primaryType: "Withdraw",
    domain,
    types: type,
    message,
  });

  return { salt, signature } as const;
};

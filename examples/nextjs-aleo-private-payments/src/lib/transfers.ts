import { getWalletProviderFromWalletAccount } from "@dynamic-labs-sdk/client/core";
import {
  isAleoWalletProvider,
  type AleoWalletAccount,
  type AleoWalletProvider,
} from "@dynamic-labs-sdk/aleo";
import {
  CREDITS_PROGRAM,
  TRANSFER_PRIVATE_FUNCTION,
  TRANSFER_PRIVATE_INPUT_TYPES,
  creditsToMicrocredits,
  isAleoAddress,
  selectSpendableRecord,
} from "@/lib/aleo";
import { dynamicClient } from "@/lib/dynamic";

/**
 * Aleo's transaction model does not fit the chain-agnostic wallet functions
 * (`transferAmount` and friends are not implemented for Aleo), so private sends
 * go through the Aleo wallet provider directly. `getWalletProviderFromWalletAccount`
 * resolves the provider that owns the account, embedded or external.
 */
const getAleoWalletProvider = (
  walletAccount: AleoWalletAccount,
): AleoWalletProvider => {
  const walletProvider = getWalletProviderFromWalletAccount(
    { walletAccount },
    dynamicClient,
  );

  if (!isAleoWalletProvider(walletProvider)) {
    throw new Error("The selected wallet is not an Aleo wallet");
  }

  return walletProvider;
};

/**
 * Lists the wallet's own `credits.aleo` records as plaintext. Records are the
 * private side of an Aleo balance: they are encrypted on chain and only the
 * owner's view key can read them, which is why they cannot be fetched from a
 * public RPC the way `getNativeBalance` reads the public balance.
 */
export const fetchCreditsRecords = async ({
  walletAccount,
}: {
  walletAccount: AleoWalletAccount;
}): Promise<unknown[]> => {
  const walletProvider = getAleoWalletProvider(walletAccount);

  if (!walletProvider.requestRecords) {
    throw new Error("This Aleo wallet cannot list private records");
  }

  const { records } = await walletProvider.requestRecords({
    options: { plaintext: true },
    program: CREDITS_PROGRAM,
    walletAccount,
  });

  return records;
};

/**
 * Sends credits privately: both the amount and the recipient stay encrypted in
 * the output records, and only the transaction id is public. Proof generation
 * runs inside the wallet, so expect the returned promise to take a few seconds.
 */
export const sendPrivateCredits = async ({
  credits,
  recipient,
  walletAccount,
}: {
  credits: string;
  recipient: string;
  walletAccount: AleoWalletAccount;
}): Promise<{ networkId: string; transactionId: string }> => {
  if (!isAleoAddress(recipient)) {
    throw new Error("Recipient must be an aleo1… address");
  }

  const microcredits = creditsToMicrocredits(credits);
  const walletProvider = getAleoWalletProvider(walletAccount);
  const records = await fetchCreditsRecords({ walletAccount });

  const inputRecord = selectSpendableRecord({ microcredits, records });
  if (!inputRecord) {
    throw new Error(
      "No single private record covers this amount. Receive a larger payment, or shield public credits, and try again.",
    );
  }

  const { networkId } = await walletProvider.getActiveNetworkId();

  const { transactionId } = await walletProvider.requestTransaction({
    transaction: {
      address: walletAccount.address,
      chainId: networkId,
      // Embedded Aleo wallets are fee-sponsored, so the fee fields are ignored
      // by the wallet. External wallets read them to build their fee record.
      fee: 0,
      feePrivate: false,
      transitions: [
        {
          functionName: TRANSFER_PRIVATE_FUNCTION,
          inputTypes: TRANSFER_PRIVATE_INPUT_TYPES,
          inputs: [inputRecord, recipient, `${microcredits}u64`],
          program: CREDITS_PROGRAM,
        },
      ],
    },
    walletAccount,
  });

  return { networkId, transactionId };
};

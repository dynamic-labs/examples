import { pad, maxUint256, zeroAddress, bytesToHex } from "viem";

const baseUrl = "https://gateway-api-testnet.circle.com/v1";

export const GatewayAPI = {
  async get(path: string) {
    return fetch(baseUrl + path).then((r) => r.json());
  },
  async post(path: string, body: unknown) {
    return fetch(baseUrl + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body, (_k, v) =>
        typeof v === "bigint" ? v.toString() : v
      ),
    }).then((r) => r.json());
  },
};

const domain = { name: "GatewayWallet", version: "1" } as const;
const EIP712Domain = [
  { name: "name", type: "string" },
  { name: "version", type: "string" },
];
const TransferSpec = [
  { name: "version", type: "uint32" },
  { name: "sourceDomain", type: "uint32" },
  { name: "destinationDomain", type: "uint32" },
  { name: "sourceContract", type: "bytes32" },
  { name: "destinationContract", type: "bytes32" },
  { name: "sourceToken", type: "bytes32" },
  { name: "destinationToken", type: "bytes32" },
  { name: "sourceDepositor", type: "bytes32" },
  { name: "destinationRecipient", type: "bytes32" },
  { name: "sourceSigner", type: "bytes32" },
  { name: "destinationCaller", type: "bytes32" },
  { name: "value", type: "uint256" },
  { name: "salt", type: "bytes32" },
  { name: "hookData", type: "bytes" },
];
const BurnIntent = [
  { name: "maxBlockHeight", type: "uint256" },
  { name: "maxFee", type: "uint256" },
  { name: "spec", type: "TransferSpec" },
];

const addressToBytes32 = (address: string) =>
  pad(address.toLowerCase() as `0x${string}`, { size: 32 });

export function burnIntent({
  account,
  from,
  to,
  amount,
  recipient,
}: {
  account: string;
  from: {
    domain: number;
    gatewayWallet: { address: `0x${string}` };
    usdc: { address: `0x${string}` };
  };
  to: {
    domain: number;
    gatewayMinter: { address: `0x${string}` };
    usdc: { address: `0x${string}` };
  };
  amount: number;
  recipient?: string;
}) {
  return {
    maxBlockHeight: maxUint256,
    maxFee: BigInt(2010000),
    spec: {
      version: 1,
      sourceDomain: from.domain,
      destinationDomain: to.domain,
      sourceContract: from.gatewayWallet.address,
      destinationContract: to.gatewayMinter.address,
      sourceToken: from.usdc.address,
      destinationToken: to.usdc.address,
      sourceDepositor: account,
      destinationRecipient: recipient || account,
      sourceSigner: account,
      destinationCaller: zeroAddress,
      value: BigInt(Math.floor(amount * 1e6)),
      salt: bytesToHex(crypto.getRandomValues(new Uint8Array(32))),
      hookData: "0x",
    },
  } as const;
}

export function burnIntentTypedData(intent: ReturnType<typeof burnIntent>) {
  const spec = intent.spec;
  return {
    types: { EIP712Domain, TransferSpec, BurnIntent },
    domain,
    primaryType: "BurnIntent" as const,
    message: {
      ...intent,
      spec: {
        ...spec,
        sourceContract: addressToBytes32(spec.sourceContract),
        destinationContract: addressToBytes32(spec.destinationContract),
        sourceToken: addressToBytes32(spec.sourceToken),
        destinationToken: addressToBytes32(spec.destinationToken),
        sourceDepositor: addressToBytes32(spec.sourceDepositor),
        destinationRecipient: addressToBytes32(spec.destinationRecipient),
        sourceSigner: addressToBytes32(spec.sourceSigner),
        destinationCaller: addressToBytes32(
          spec.destinationCaller || zeroAddress
        ),
      },
    },
  } as const;
}

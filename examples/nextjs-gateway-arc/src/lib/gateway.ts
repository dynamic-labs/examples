import { pad, zeroAddress, maxUint256 } from "viem";

export const GatewayAPI = {
  baseUrl: "https://gateway-api-testnet.circle.com/v1",
  async get(path: string) {
    const res = await fetch(this.baseUrl + path);
    return res.json();
  },
  async post(path: string, body: unknown) {
    const res = await fetch(this.baseUrl + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body, (_k, v) =>
        typeof v === "bigint" ? v.toString() : v
      ),
    });
    return res.json();
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

export function addressToBytes32(address: string) {
  return pad(address.toLowerCase(), { size: 32 });
}

export function burnIntent(params: {
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
    maxFee: 2_010000n,
    spec: {
      version: 1,
      sourceDomain: params.from.domain,
      destinationDomain: params.to.domain,
      sourceContract: params.from.gatewayWallet.address,
      destinationContract: params.to.gatewayMinter.address,
      sourceToken: params.from.usdc.address,
      destinationToken: params.to.usdc.address,
      sourceDepositor: params.account,
      destinationRecipient: params.recipient || params.account,
      sourceSigner: params.account,
      destinationCaller: zeroAddress,
      value: BigInt(Math.floor(params.amount * 1e6)),
      salt: `0x${crypto
        .getRandomValues(new Uint8Array(32))
        .reduce((s, b) => s + b.toString(16).padStart(2, "0"), "")}`,
      hookData: "0x",
    },
  } as const;
}

export function burnIntentTypedData(intent: ReturnType<typeof burnIntent>) {
  return {
    types: { EIP712Domain, TransferSpec, BurnIntent },
    domain,
    primaryType: "BurnIntent" as const,
    message: {
      ...intent,
      spec: {
        ...intent.spec,
        sourceContract: addressToBytes32(intent.spec.sourceContract),
        destinationContract: addressToBytes32(intent.spec.destinationContract),
        sourceToken: addressToBytes32(intent.spec.sourceToken),
        destinationToken: addressToBytes32(intent.spec.destinationToken),
        sourceDepositor: addressToBytes32(intent.spec.sourceDepositor),
        destinationRecipient: addressToBytes32(
          intent.spec.destinationRecipient
        ),
        sourceSigner: addressToBytes32(intent.spec.sourceSigner),
        destinationCaller: addressToBytes32(
          intent.spec.destinationCaller || zeroAddress
        ),
      },
    },
  } as const;
}

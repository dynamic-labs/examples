export type Hex = `0x${string}`;

export type OperationStage =
  | "setup"
  | "input"
  | "request"
  | "batch"
  | "submitted"
  | "not_included";

export type DepositStage =
  | "setup"
  | "input"
  | "request"
  | "batch"
  | "submitted"
  | "confirmed"
  | "not_included";

export interface PodsBytecodeCall {
  to: Hex;
  data: Hex;
  value: string;
}

export interface DepositBytecodeRequest {
  strategyId: string;
  chainId: number;
  amount: string;
  asset: Hex;
  wallet: Hex;
}

export interface DepositBytecodeResponse {
  id?: string;
  chainId?: number | string;
  bytecode: PodsBytecodeCall[];
  requestUrl?: string;
  raw?: unknown;
}

export interface BatchCall {
  to: Hex;
  value: bigint;
  data: Hex;
}

export interface BatchSubmissionResponse {
  submittedHash: Hex;
  transactionHash?: Hex;
  inclusion?: UserOperationInclusionResponse;
}

export interface EntryPointUserOperationLog {
  address: Hex;
  blockNumber?: Hex;
  logIndex?: Hex;
  topics: Hex[];
  transactionHash?: Hex;
}

export interface UserOperationSenderState {
  assetBalance?: string;
  balance: string;
  code: Hex;
  transactionCount: string;
}

export interface UserOperationInclusionRequest {
  asset?: Hex;
  fromBlock?: Hex;
  sender: Hex;
  userOperationHash: Hex;
}

export interface UserOperationInclusionResponse {
  entryPointLogs: EntryPointUserOperationLog[];
  fromBlock: Hex;
  included: boolean;
  latestBlock: Hex;
  searchedBlocks: number;
  searchedEntryPoints: Hex[];
  senderState: UserOperationSenderState;
  toBlock: Hex;
  transactionHash?: Hex;
  userOperationHash: Hex;
}

export interface NormalizedError {
  stage: OperationStage;
  message: string;
  status?: number;
  details?: unknown;
}

export type ApiEnvelope<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      error: NormalizedError;
    };

export type ValidationResult<T> =
  | {
      ok: true;
      value: T;
    }
  | {
      ok: false;
      error: string;
    };

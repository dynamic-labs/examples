import {
  CardEncryptedDataResponse,
  CreateCardForUserRequest,
  CreateCardForUserResponse,
  CreateUserApplicationRequest,
  CreateUserApplicationResponse,
  SpendTransactionResponse,
  TransactionResponse,
  UserCreditBalanceResponse,
  UserDepositContractResponse,
  UserWithdrawalRequest,
  UserWithdrawalRequestPending,
  UserWithdrawalSignatureRequest,
  UserWithdrawalSignatureResponse,
} from "./types";
import { rainClient } from "./client";

export interface TransactionQueryParams {
  userId?: string;
  cardId?: string;
  cursor?: string;
  limit?: number; // 1 to 100, defaults to 20
}

// Type guard to check if response is pending
function isWithdrawalRequestPending(
  response: UserWithdrawalSignatureResponse
): response is UserWithdrawalRequestPending {
  return response.status === "pending";
}

export async function createUserApplication(
  data: CreateUserApplicationRequest
): Promise<CreateUserApplicationResponse> {
  return rainClient.post<
    CreateUserApplicationRequest,
    CreateUserApplicationResponse
  >("/v1/issuing/applications/user", data);
}

export async function createCardForUser(
  userId: string,
  data: CreateCardForUserRequest
): Promise<CreateCardForUserResponse> {
  return rainClient.post<CreateCardForUserRequest, CreateCardForUserResponse>(
    `/v1/issuing/users/${userId}/cards`,
    data
  );
}

export function userCreditBalance(
  userId: string
): Promise<UserCreditBalanceResponse> {
  return rainClient.get<UserCreditBalanceResponse>(
    `/v1/issuing/users/${userId}/balances`
  );
}

export function cardEncryptedData(
  cardId: string,
  secret: string
): Promise<CardEncryptedDataResponse> {
  return rainClient.get<CardEncryptedDataResponse>(
    `v1/issuing/cards/${cardId}/secrets`,
    { SessionId: secret }
  );
}

export function createUserDepositContract(userId: string, chainId: number) {
  return rainClient.post(`/v1/issuing/users/${userId}/contracts`, { chainId });
}

export function userDepositContract(
  userId: string
): Promise<Array<UserDepositContractResponse>> {
  return rainClient.get<Array<UserDepositContractResponse>>(
    `/v1/issuing/users/${userId}/contracts`
  );
}

export function transactions(
  params?: TransactionQueryParams
): Promise<Array<TransactionResponse>> {
  const query = new URLSearchParams();
  if (params?.userId) query.set("userId", params.userId);
  if (params?.cardId) query.set("cardId", params.cardId);
  if (params?.cursor) query.set("cursor", params.cursor);
  if (params?.limit) query.set("limit", params.limit.toString());

  const url = `/v1/issuing/transactions${
    query.toString() ? `?${query.toString()}` : ""
  }`;

  return rainClient.get<Array<TransactionResponse>>(url);
}

export async function userWithdrawalSignature(
  userId: string,
  data: UserWithdrawalSignatureRequest,
  maxRetries: number = 10
): Promise<UserWithdrawalRequest> {
  const query = new URLSearchParams();
  query.set("chainId", data.chainId.toString());
  query.set("token", data.token);
  query.set("amount", data.amount);
  query.set("adminAddress", data.adminAddress);
  query.set("recipientAddress", data.recipientAddress);

  const response = await rainClient.get<UserWithdrawalSignatureResponse>(
    `/v1/issuing/users/${userId}/signatures/withdrawals?${query.toString()}`
  );

  if (isWithdrawalRequestPending(response)) {
    if (maxRetries <= 0) throw new Error("Maximum retry attempts reached");

    // Wait for retryAfter seconds as specified by the API
    await new Promise((resolve) =>
      setTimeout(resolve, response.retryAfter * 1000)
    );

    // Recursively retry with decremented maxRetries
    return await userWithdrawalSignature(userId, data, maxRetries - 1);
  }

  return response;
}

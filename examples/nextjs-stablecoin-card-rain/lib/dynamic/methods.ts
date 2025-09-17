import { dynamicClient } from "./dynamic-client";

export async function updateUserMetadata(
  userId: string,
  metadata: Record<string, any>
) {
  await dynamicClient.put(`/users/${userId}`, { metadata });
}

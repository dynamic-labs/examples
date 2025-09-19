import { useDynamicClientState } from "./useDynamicClientState";

/**
 * Hook that provides access to the current Dynamic user.
 *
 * @returns The authenticated Dynamic user object, or null if not authenticated
 */
export const useDynamicUser = () => {
  return useDynamicClientState("userChanged", (client) => client.user, null);
};

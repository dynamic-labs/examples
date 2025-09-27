import { type Address, getContractAddress, type Hex, type StateOverride } from "viem";

import { CREATE2_FACTORY, CREATE2_SALT } from "@/lens/constants";
import { Lens } from "@/lens/read-withdraw-queue.s.sol";

const address = getContractAddress({
  bytecode: Lens.bytecode,
  from: CREATE2_FACTORY,
  opcode: "CREATE2",
  salt: CREATE2_SALT,
});

// NOTE: If type inference isn't working, ensure contract *does not* use named return values!

/**
 * Reads a vault's entire `withdrawQueue` with a single call
 *
 * @param metaMorpho The address of the vault to read from.
 *
 * @example
 * // Use with viem's deployless option (special bytecode `data` for `eth_call`; `to` is left undefined)
 * const { data } = useReadContract({
 *   chainId,
 *   ...readWithdrawQueue(metaMorphoAddress, true),
 * });
 *
 * @example
 * // Use with `stateOverride`
 * const { data } = useReadContract({
 *   chainId,
 *   ...readWithdrawQueue(metaMorphoAddress),
 *   stateOverride: [readWithdrawQueueStateOverride()],
 * });
 *
 * @example
 * // Use with multicall -- MUST use `stateOverride` rather than viem's deployless option
 * const { data } = useReadContracts({
 *   contracts: metaMorphoAddresses
 *     .map((address) => [
 *       { chainId, address, abi: metaMorphoAbi, functionName: "maxWithdraw", args: [userAddress] },
 *       { chainId, ...readWithdrawQueue(address) },
 *     ])
 *     .flat(),
 *   allowFailure: false,
 *   stateOverride: [readWithdrawQueueStateOverride()],
 * });
 */
export function readWithdrawQueue(
  metaMorpho: Address,
  deployless?: false,
): Omit<ReturnType<typeof Lens.read.withdrawQueue>, "humanReadableAbi"> & { address: Address };
export function readWithdrawQueue(
  metaMorpho: Address,
  deployless: true,
): Omit<ReturnType<typeof Lens.read.withdrawQueue>, "humanReadableAbi"> & { code: Hex };
export function readWithdrawQueue(metaMorpho: Address, deployless: boolean = false) {
  const { humanReadableAbi, ...action } = Lens.read.withdrawQueue(metaMorpho);

  if (deployless) {
    return { ...action, code: Lens.bytecode } as const;
  } else {
    return { ...action, address } as const;
  }
}

export function readWithdrawQueueStateOverride(): StateOverride[number] {
  return {
    address,
    code: Lens.deployedBytecode,
  };
}

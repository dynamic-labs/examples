/**
 * This settles real USDC on Base mainnet (see WithdrawalForm.tsx's original
 * comment, now shared by DepositForm.tsx and WithdrawForm.tsx) — there's no
 * testnet fallback, so a demo-appropriate cap is the only thing standing
 * between a typo (e.g. "100" instead of "1.00") and an expensive mistake.
 * Shared by both directions rather than given each its own limit: the same
 * USDC/Base rail carries both, so there's no reason for one direction to be
 * riskier than the other. Raise this if you actually need to test a larger
 * amount.
 */
export const MAX_AMOUNT_USD = 5;

/**
 * Fixed, conservative ETH amount treated as "enough gas for one Flow
 * withdrawal transaction" on Base mainnet — deliberately not a computed
 * estimate. Flow doesn't expose a way to estimate the withdrawal
 * transaction's actual gas before attachFlowSource/getFlowQuote/
 * submitFlowTransaction run (see WithdrawForm.tsx), so there's nothing to
 * estimate against pre-submit; this is headroom instead.
 *
 * Anchored to a real measured data point, not theory: submitFlowTransaction
 * asserts sufficient balance server-side by default
 * (assertBalanceForGasCost), and a real withdrawal attempt against this
 * threshold's first value (0.00002 ETH) was rejected with a stated
 * requirement of 0.0000576 ETH — ~2.9x higher. That gap means the
 * withdrawal transaction isn't just a plain ~65,000-gas ERC-20 transfer (the
 * assumption the first value was sized against); it evidently costs more,
 * likely from additional contract calls Flow makes as part of settlement.
 * Set to ~1.7x that measured value for margin against gas price movement
 * between checks — not sized from BaseScan's gas tracker/generic Base-cost
 * math again, since that math was tried once already and undershot by 3x.
 * This is the balance *threshold* below which Withdraw is blocked — see
 * VAULT_GAS_TOPUP_ETH below for why the top-up button sends more than this.
 */
export const MIN_VAULT_GAS_ETH = '0.0001';

/**
 * ETH amount WithdrawForm's "Send ETH to vault" button actually sends —
 * deliberately higher than MIN_VAULT_GAS_ETH, not equal to it. The most
 * common trigger for that button is a vault at ~0 ETH, so funding it to
 * exactly the pass/fail threshold would leave zero margin for the very
 * withdrawal it's meant to unblock (e.g. if the real gas cost ever lands
 * marginally above the fixed estimate). Set to 2x MIN_VAULT_GAS_ETH — good
 * for roughly two withdrawals per top-up at the measured real cost (see
 * MIN_VAULT_GAS_ETH's comment), not a much larger, unnecessary reserve.
 */
export const VAULT_GAS_TOPUP_ETH = '0.0002';

/**
 * Fixed, conservative ETH amount assumed sufficient for the *external*
 * wallet's own gas to broadcast the "Send ETH to vault" transfer itself —
 * checked against that wallet's balance before attempting the transfer, on
 * top of VAULT_GAS_TOPUP_ETH, so a wallet with just enough for the transfer
 * amount but nothing left for its own gas fails fast with a clear message
 * instead of surfacing a raw "insufficient funds" error from the wallet
 * provider (see WithdrawForm.tsx). Smaller than MIN_VAULT_GAS_ETH: this
 * transfer is a plain native ETH send (~21,000 gas), simpler than whatever
 * the withdrawal transaction itself does — see MIN_VAULT_GAS_ETH's comment
 * for why that turned out to cost more than a plain transfer.
 */
export const EXTERNAL_WALLET_GAS_BUFFER_ETH = '0.00003';

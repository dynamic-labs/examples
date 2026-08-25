/**
 * Small glyph icons shared across the vault screen (VaultBalanceCard.tsx)
 * and the flow status screen (FlowStatusScreen.tsx) — deposit/withdraw
 * arrows, refresh, and two filled step-state glyphs (check/alert). Kept to
 * this handful rather than porting demo-dashboard's full hand-drawn
 * scenario illustrations (BalanceIllustration/WithdrawIllustration) — this
 * is a single mobile card plus a status list, not a set of per-scenario
 * landing pages, so the simpler "dashboard tier" of that reference app's
 * icon set is the better fit. All paths use `currentColor` via the `color`
 * prop so callers can theme them with existing theme.ts tokens instead of
 * hardcoding hex here.
 */
import Svg, { Circle, Path } from 'react-native-svg';

type IconProps = {
  size?: number;
  color: string;
};

export function DepositIcon({ size = 18, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 4v11m0 0-4-4m4 4 4-4M5 19h14"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function WithdrawIcon({ size = 18, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 15V4m0 0 4 4m-4-4-4 4M5 19h14"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function RefreshIcon({ size = 16, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 10a8 8 0 0 1 14.7-3.6M20 4v5h-5M20 14a8 8 0 0 1-14.7 3.6M4 20v-5h5"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Filled circle + white checkmark — a "this step is done" glyph for
 * FlowStatusScreen's step list. Unlike the outline icons above, `color`
 * fills the circle rather than strokes a path, since the glyph inside is
 * always white for contrast regardless of what's underneath.
 */
export function CheckCircleIcon({ size = 22, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={12} fill={color} />
      <Path
        d="M7 12.5l3 3 7-7"
        stroke="#FFFFFF"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Filled circle + white exclamation mark — a "this step failed" glyph. */
export function AlertCircleIcon({ size = 22, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={12} fill={color} />
      <Path
        d="M12 7v6"
        stroke="#FFFFFF"
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Circle cx={12} cy={16.5} r={1.15} fill="#FFFFFF" />
    </Svg>
  );
}

/** Back-navigation chevron - Header.tsx's back button, in place of relying
 * on native-stack's own header (this app renders its own Header per screen
 * instead, for full control over the full-bleed redesign's look). */
export function ChevronLeftIcon({ size = 20, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 6l-6 6 6 6"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Right-pointing chevron - ListRow.tsx's default trailing affordance for a
 * tappable row (e.g. a wallet option in WalletPickerView). */
export function ChevronRightIcon({ size = 18, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 6l6 6-6 6"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Person-in-circle glyph - Home's header button that opens AccountRoute
 * (email + Log out), now that there's no persistent external-wallet chip to
 * attach account controls to (see HomeView.tsx). */
export function PersonIcon({ size = 20, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={8} r={3.5} stroke={color} strokeWidth={2} />
      <Path
        d="M4.5 19.5c1.5-3.5 4.5-5.5 7.5-5.5s6 2 7.5 5.5"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

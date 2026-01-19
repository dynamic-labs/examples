/**
 * DFlow Prediction Market Types
 */

export type MarketStatus = "open" | "active" | "closed" | "determined" | "finalized";
export type PositionSide = "yes" | "no";
export type OrderStatus = "open" | "filled" | "cancelled";
export type RedemptionStatus = "open" | "pending" | "closed";

export interface Market {
  id: string;
  question: string;
  endDate: string;
  yesPrice: string;
  noPrice: string;
  category: string;
  imageUrl: string;
  yesTraders: number;
  noTraders: number;
  ticker: string;
  yesTokenMint?: string;
  noTokenMint?: string;
  tags: string[];
  volume: number;
  status: "open" | "closed" | "settled";
}

export interface Position {
  marketId: string;
  ticker: string;
  question: string;
  side: PositionSide;
  size: number;
  avgPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
  outcomeMint: string;
  settlementMint?: string;
  marketStatus?: MarketStatus;
  isRedeemable?: boolean;
  redemptionStatus?: RedemptionStatus;
  result?: PositionSide | "";
  scalarOutcomePct?: number;
  category?: string;
  imageUrl?: string;
}

export interface Order {
  id: string;
  marketId: string;
  ticker: string;
  side: PositionSide;
  orderType: "market" | "limit";
  size: number;
  price: number;
  filledSize: number;
  status: OrderStatus;
  createdAt: string;
}

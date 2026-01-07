/**
 * Kalshi/DFlow market types
 */

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
  side: "yes" | "no";
  size: number;
  avgPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
}

export interface Order {
  id: string;
  marketId: string;
  ticker: string;
  side: "yes" | "no";
  orderType: "market" | "limit";
  size: number;
  price: number;
  filledSize: number;
  status: "open" | "filled" | "cancelled";
  createdAt: string;
}

export interface TradeParams {
  marketId: string;
  ticker: string;
  tokenMint: string;
  side: "yes" | "no";
  amount: number;
  price?: number;
  isMarketOrder?: boolean;
}

export interface SellParams {
  marketId: string;
  tokenMint: string;
  side: "yes" | "no";
  size: number;
  price?: number;
  isMarketOrder?: boolean;
}


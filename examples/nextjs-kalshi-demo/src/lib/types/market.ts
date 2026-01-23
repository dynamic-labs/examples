export interface Market {
  id: string;
  question: string;
  endDate: string;
  yesPrice: string;
  noPrice: string;
  imageUrl: string;
  yesTraders: number;
  noTraders: number;
  volume: number;
}

export interface DFlowMarketAccount {
  yesMint: string;
  noMint: string;
  marketLedger: string;
  redemptionStatus: string;
}

export interface DFlowMarket {
  id: string;
  title: string;
  subtitle?: string;
  ticker: string;
  category: string;
  status: string;
  result: string;
  accounts: Record<string, DFlowMarketAccount>;
  yesBid?: string | null;
  yesAsk?: string | null;
  noBid?: string | null;
  noAsk?: string | null;
  volume?: number;
  openInterest?: number;
  expirationTime?: number;
  imageUrl?: string;
}

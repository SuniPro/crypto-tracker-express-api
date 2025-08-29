export interface CryptoDepositResponse {
  chainType: "TRON" | "ETH" | "BTC";
  cryptoType: "USDT" | "ETH" | "BTC";
  fromAddress: string;
  toAddress: string;
  cryptoAmount: string;
  decimals: number;
  status:
    | "PENDING"
    | "PROCESSING"
    | "CONFIRMED"
    | "FAILED"
    | "CANCELLED"
    | "TIMEOUT";
  acceptedAt: number;
  memo: string;
}

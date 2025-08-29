import { ExchangeInfoResponse } from "../model/exchange";
import { getFromAnyServer } from "./base";

export async function getCryptoExchange(
  cryptoType: "USDT" | "BTC" | "ETH",
): Promise<ExchangeInfoResponse> {
  const response = await getFromAnyServer(
    `https://api.bithumb.com/public/ticker/${cryptoType}_KRW`,
  );

  return response.data;
}

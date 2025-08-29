import { ExchangeInfo } from "../model/exchange";
import { getCryptoExchange } from "../api/exchange";

/**
 * "USDT" | "BTC" | "ETH" 중 하나를 받아 KRW 기준의 시세를 가져오는 함수입니다.
 * */
export async function getCryptoExchangeInfo(
  cryptoType: "USDT" | "BTC" | "ETH",
): Promise<ExchangeInfo | undefined> {
  return getCryptoExchange(cryptoType)
    .then((data) => {
      if (!data) return undefined;
      return data.data;
    })
    .catch(() => undefined);
}

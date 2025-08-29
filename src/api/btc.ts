import { getFromAnyServer } from "./base";
import {
  BlockCypherAddressResponse,
  BlockCypherTransactionResponse,
  BTCBalanceResponseType,
} from "../model/btc";

export async function getBalanceBTC(
  address: string,
): Promise<BTCBalanceResponseType> {
  const response = await getFromAnyServer(
    `https://api.blockcypher.com/v1/btc/main/addrs/${address}/balance`,
  );

  return response.data;
}

export async function getBTCTransferList(
  address: string,
): Promise<BlockCypherAddressResponse> {
  const response = await getFromAnyServer(
    `https://api.blockcypher.com/v1/btc/main/addrs/${address}`,
  );

  return response.data;
}

export async function getBTCTransactionDetail(
  hash: string,
): Promise<BlockCypherTransactionResponse> {
  const response = await getFromAnyServer(
    `https://api.blockcypher.com/v1/btc/main/txs/${hash}`,
  );

  return response.data;
}

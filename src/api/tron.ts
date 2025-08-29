import { TronTransferResponse } from "../model/tron";
import { getFromAnyServer } from "./base";

export async function getTransactionTron(
  address: string,
  limit: number,
  order: "asc" | "desc",
): Promise<TronTransferResponse[]> {
  const response = await getFromAnyServer(
    `https://api.trongrid.io/v1/accounts/${address}/transactions/trc20?limit=${limit}&order_by=block_timestamp,${order}`,
  );

  return response.data.data;
}

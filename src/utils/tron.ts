import { getTransactionTron } from "../api/tron";
import { TronWeb } from "tronweb";
import logger from "../config/logger";
import { CryptoDepositResponse } from "../model/crypto";
import { NormalizedTransfer } from "../routes/transfer";
import { BalanceResponseType } from "../routes/wallet";

const tronWeb = new TronWeb({
  fullHost: "https://api.trongrid.io",
});

export async function tronGetBalance(
  wallet: string,
): Promise<BalanceResponseType | undefined> {
  if (!tronWeb.isAddress(wallet)) return undefined;
  try {
    const result = await tronWeb.trx.getAccount(wallet);
    return { balance: result.balance.toString() };
  } catch {
    logger.error("잔액조회 실패 : " + wallet);
    return undefined;
  }
}

export async function tronChainValidation(wallet: string): Promise<boolean> {
  if (!tronWeb.isAddress(wallet)) return false;
  try {
    await tronWeb.trx.getAccount(wallet);
    return true;
  } catch {
    logger.error("지갑 검증 실패 : " + wallet);
    return false;
  }
}

/**
 * 특정 주소(fromAddress)의 최신 거래 내역 중,
 * 특정 상대방(toAddress)에게 보낸 가장 최신 거래 1건을 찾아 반환합니다.
 * @param fromAddress 기준이 되는 보내는 주소
 * @param toAddress 찾고 싶은 받는 주소
 * @param requestedAt
 * @returns 찾은 경우 TronTransactionResponse, 못 찾은 경우 undefined
 */
export async function TronFindLatestTransferToAddress(
  fromAddress: string,
  toAddress: string,
  requestedAt: number,
): Promise<CryptoDepositResponse | undefined> {
  const recentTransfer = await getTransactionTron(toAddress, 20, "desc");

  if (!Array.isArray(recentTransfer)) {
    // 'error' 레벨로 심각한 오류를 기록
    logger.error(
      "Expected recentTransactions.data to be an array, but it was not.",
    );
    return undefined;
  }

  const tx = recentTransfer
    .filter((tx) => tx.block_timestamp >= requestedAt)
    .find((tx) => tx.from === fromAddress);

  logger.info("[TRANSFER INFO] Raw :" + tx);

  if (!tx) return undefined;

  const supportedTypes = ["USDT", "ETH", "BTC"] as const;
  const symbol = tx.token_info.symbol;

  if (!supportedTypes.includes(symbol as any)) return undefined;

  return {
    chainType: "TRON",
    cryptoType: symbol as (typeof supportedTypes)[number],
    fromAddress: tx.from,
    toAddress: tx.to,
    cryptoAmount: tx.value,
    decimals: tx.token_info.decimals,
    status: "CONFIRMED",
    acceptedAt: tx.block_timestamp,
    memo: "success",
  };
}

export async function TronTransfer(
  address: string,
): Promise<NormalizedTransfer[] | undefined> {
  const recentTransfer = await getTransactionTron(address, 100, "desc");

  if (!Array.isArray(recentTransfer)) {
    // 'error' 레벨로 심각한 오류를 기록
    logger.error(
      "Expected recentTransactions.data to be an array, but it was not.",
    );
    return undefined;
  }

  return recentTransfer.map((tx) => {
    return {
      chainType: "TRON",
      cryptoType: tx.token_info.symbol,
      fromAddress: tx.from,
      toAddress: tx.to,
      cryptoAmount: tx.value,
      decimals: tx.token_info.decimals,
      status: "CONFIRMED",
      acceptedAt: tx.block_timestamp,
      memo: "success",
    };
  });
}

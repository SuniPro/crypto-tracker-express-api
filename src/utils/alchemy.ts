import "dotenv/config";
import {
  Alchemy,
  AssetTransfersCategory,
  AssetTransfersWithMetadataResult,
  Network,
  SortingOrder,
} from "alchemy-sdk";
import { isAddress } from "ethers";
import { DateTime } from "luxon";
import { CryptoDepositResponse } from "../model/crypto";

import BigNumber from "bignumber.js";
import { NormalizedTransfer } from "../routes/transfer";
import logger from "../config/logger";
import { BalanceResponseType } from "../routes/wallet";

const config = {
  apiKey: process.env.ALCHEMY_API_ETH_KEY,
  network: Network.ETH_MAINNET,
};

const alchemy = new Alchemy(config);

const SUPPORTED_CRYPTO = ["USDT", "ETH"] as const;
type SupportedCrypto = (typeof SUPPORTED_CRYPTO)[number];

function isSupportedCrypto(symbol: any): symbol is SupportedCrypto {
  return SUPPORTED_CRYPTO.includes(symbol);
}

export async function ethGetBalance(
  wallet: string,
): Promise<BalanceResponseType | undefined> {
  if (!isAddress(wallet)) return undefined;
  try {
    const balance = await alchemy.core.getBalance(wallet);
    return { balance: balance.toString() };
  } catch {
    logger.error("잔액조회 실패 : " + wallet);
    return undefined;
  }
}

export async function ethChainValidation(wallet: string): Promise<boolean> {
  if (!isAddress(wallet)) return false;
  try {
    await alchemy.core.getBalance(wallet);
    return true;
  } catch {
    return false;
  }
}

export async function EthFindLatestTransferToAddress(
  toAddress: string,
  fromAddress: string,
  requestedAt: number,
): Promise<CryptoDepositResponse | undefined> {
  // USDT와 ETH 거래 내역을 병렬로 가져옵니다.
  const [usdtResult, ethResult] = await Promise.all([
    alchemy.core.getAssetTransfers({
      toAddress,
      fromAddress,
      order: SortingOrder.DESCENDING,
      category: [AssetTransfersCategory.ERC20],
      maxCount: 10,
    }),
    alchemy.core.getAssetTransfers({
      toAddress,
      fromAddress,
      order: SortingOrder.DESCENDING,
      category: [
        AssetTransfersCategory.EXTERNAL,
        AssetTransfersCategory.INTERNAL,
      ],
      maxCount: 10,
    }),
  ]);

  // 필수 값이 있는 유효한 거래만 필터링합니다.
  const validTransfers = [
    ...usdtResult.transfers,
    ...ethResult.transfers,
  ].filter(
    (tx) =>
      tx.from.toLowerCase() === fromAddress.toLowerCase() &&
      tx.rawContract.value &&
      tx.rawContract.decimal,
  );

  if (validTransfers.length === 0) return undefined;

  // 필요한 블록 번호들을 모아 모든 블록 정보를 병렬로 가져옵니다.
  const blockNums = [...new Set(validTransfers.map((tx) => tx.blockNum))];
  const blocks = await Promise.all(
    blockNums.map((blockNum) => alchemy.core.getBlock(blockNum)),
  );

  // 빠른 조회를 위해 블록 번호(10진수)를 키로 하는 타임스탬프 Map을 만듭니다.
  const blockTimestampMap = new Map<string, number>();
  blocks.forEach((block) => {
    blockTimestampMap.set(block.number.toString(), block.timestamp * 1000);
  });

  // 2. [개선] 모든 정보를 합친 풍부한(enriched) 객체 배열을 먼저 만듭니다.
  const enrichedTransfers = validTransfers.map((tx) => {
    const decimalBlockNum = parseInt(tx.blockNum, 16);
    return {
      ...tx,
      decimalBlockNum: decimalBlockNum,
      timestamp: blockTimestampMap.get(decimalBlockNum.toString()) ?? 0,
    };
  });

  // 3. 모든 정보가 준비된 상태에서 정렬 후, 최종 거래를 찾습니다.
  const finalTx = enrichedTransfers
    .sort((a, b) => b.decimalBlockNum - a.decimalBlockNum)
    .find((tx) => tx.timestamp >= requestedAt);

  if (!finalTx) return undefined;

  const { asset: symbol, rawContract, from, to, timestamp } = finalTx;
  const isSupported = isSupportedCrypto(symbol);

  if (!isSupported) return undefined;

  return {
    chainType: "ETH",
    cryptoType: isSupported ? symbol : "USDT", // 타입 가드를 통과했으므로 안전
    fromAddress: from,
    toAddress: to!,
    cryptoAmount: new BigNumber(rawContract.value!).toString(),
    status: "CONFIRMED",
    decimals: parseInt(rawContract.decimal!, 16),
    acceptedAt: DateTime.fromMillis(timestamp).setZone("Asia/Seoul").toMillis(),
    memo: "success",
  };
}

const categories = [
  AssetTransfersCategory.EXTERNAL, // ETH 외부
  AssetTransfersCategory.INTERNAL, // ETH 내부
  AssetTransfersCategory.ERC20, // 토큰 전송
] as const;

export async function EthTransfer(
  address: string,
): Promise<NormalizedTransfer[] | undefined> {
  const PAGE_SIZE = 100; // 호출당 최대
  const TARGET = 100; // 최종 최대 반환 건수

  const [outRes, inRes] = await Promise.all([
    alchemy.core.getAssetTransfers({
      fromAddress: address,
      category: categories as unknown as AssetTransfersCategory[],
      order: SortingOrder.DESCENDING,
      maxCount: PAGE_SIZE,
      excludeZeroValue: true,
      withMetadata: true,
    }),
    alchemy.core.getAssetTransfers({
      toAddress: address,
      category: categories as unknown as AssetTransfersCategory[],
      order: SortingOrder.DESCENDING,
      maxCount: PAGE_SIZE,
      excludeZeroValue: true,
      withMetadata: true,
    }),
  ]);

  // 병합 + 중복 제거
  const seen = new Map<string, AssetTransfersWithMetadataResult>();
  for (const tx of [...outRes.transfers, ...inRes.transfers]) {
    const key =
      tx.uniqueId ??
      `${tx.hash ?? ""}:${tx.category ?? ""}:${tx.rawContract?.address ?? ""}:${
        tx.blockNum ?? ""
      }`;
    if (!seen.has(key)) seen.set(key, tx);
  }

  const merged = Array.from(seen.values());

  // 정렬: blockTimestamp(desc) → blockNum(desc) → uniqueId/hash(desc)
  const ts = (t: AssetTransfersWithMetadataResult) =>
    Date.parse(t.metadata?.blockTimestamp ?? "0");

  const bn = (t: AssetTransfersWithMetadataResult) =>
    t.blockNum ? parseInt(t.blockNum, 16) : -1;

  const id = (t: AssetTransfersWithMetadataResult) =>
    t.uniqueId ?? t.hash ?? "";

  merged.sort(
    (a, b) => ts(b) - ts(a) || bn(b) - bn(a) || id(b).localeCompare(id(a)),
  );
  // 상위 100건만 사용
  const top = merged.slice(0, TARGET);

  // ---- 정규화 매핑 ----
  return top.map((tx) => {
    const category = String(tx.category).toLowerCase();
    const isEth =
      category === "external" || category === "internal" || tx.asset === "ETH";
    const decimals = isEth
      ? 18
      : tx.rawContract?.decimal != null
      ? // 일부 응답에 0x형식으로 올 수 있어 대비
        typeof tx.rawContract.decimal === "string"
        ? parseInt(tx.rawContract.decimal as unknown as string, 16)
        : Number(tx.rawContract.decimal)
      : null;

    // 금액 계산: 가능한 경우 rawContract.value(HEX)를 사용해 정확히 계산
    let cryptoAmount: string | null = null;
    const rawHex = tx.rawContract?.value as string | undefined;

    if (rawHex && decimals != null) {
      try {
        const smallest = BigInt(rawHex); // HEX → BigInt(최소단위)
        cryptoAmount = new BigNumber(smallest.toString())
          .dividedBy(new BigNumber(10).pow(decimals))
          .toString();
      } catch {
        // fallback: value 필드(있다면) 사용
        cryptoAmount = tx.value != null ? String(tx.value) : null;
      }
    } else {
      // ETH/토큰 모두 value가 있으면 그대로 사용 (일부 케이스에서 이미 사람이 읽는 단위)
      cryptoAmount = tx.value != null ? String(tx.value) : null;
    }

    const acceptedAt = DateTime.fromISO(
      tx.metadata?.blockTimestamp ?? new Date(0).toISOString(),
    )
      .setZone("Asia/Seoul")
      .toMillis();

    return {
      chainType: "ETH",
      cryptoType: tx.asset ? tx.asset : null,
      fromAddress: tx.from,
      toAddress: tx.to,
      cryptoAmount,
      status: "CONFIRMED", // getTransactionReceipt를 조회하면 success/failed 구분 가능
      decimals,
      acceptedAt,
      memo: "success",
    };
  });
}

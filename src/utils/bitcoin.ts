import {
  getBalanceBTC,
  getBTCTransactionDetail,
  getBTCTransferList,
} from "../api/btc";
import { CryptoDepositResponse } from "../model/crypto";
import { DateTime } from "luxon";
import logger from "../config/logger";
import { NormalizedTransfer } from "../routes/transfer";
import { BalanceResponseType } from "../routes/wallet";

export async function btcGetBalance(
  wallet: string,
): Promise<BalanceResponseType | undefined> {
  try {
    const result = await getBalanceBTC(wallet);
    return { balance: result.balance.toString() };
  } catch {
    logger.error("잔액조회 실패 : " + wallet);
    return undefined;
  }
}

export async function btcChainValidation(wallet: string): Promise<boolean> {
  try {
    await getBalanceBTC(wallet);
    return true;
  } catch {
    return false;
  }
}

export async function BtcFindLatestTransferToAddress(
  toAddress: string,
  fromAddress: string,
  requestedAt: number,
): Promise<CryptoDepositResponse | undefined> {
  try {
    // 1. 주소와 관련된 거래 요약 목록을 가져옵니다.
    const addressInfo = await getBTCTransferList(toAddress);
    if (!addressInfo.txrefs || addressInfo.txrefs.length === 0) {
      return undefined;
    }

    // 2. 모든 거래의 상세 내역을 병렬로 가져옵니다.
    const uniqueTxHashes = [
      ...new Set(addressInfo.txrefs.map((tx) => tx.tx_hash)),
    ];
    const detailedTransactions = await Promise.all(
      uniqueTxHashes.map((hash) => getBTCTransactionDetail(hash)),
    );

    // 3. [개선] 상세 거래 내역을 시간순으로 정렬한 뒤, 조건에 맞는 첫 번째 거래를 찾습니다.
    const finalTx = detailedTransactions
      .sort(
        (a, b) =>
          new Date(b.confirmed).getTime() - new Date(a.confirmed).getTime(),
      )
      .find((tx) => {
        const txTimestamp = new Date(tx.confirmed).getTime();
        if (txTimestamp < requestedAt) return false;

        // inputs 배열을 모두 확인하여 fromAddress가 포함되어 있는지 검사합니다.
        return tx.inputs.some((input) =>
          input.addresses.some(
            (addr) => addr.toLowerCase() === fromAddress.toLowerCase(),
          ),
        );
      });

    if (!finalTx) {
      logger.info(
        `[BTC] No transaction found for fromAddress: ${fromAddress} after timestamp: ${requestedAt}`,
      );
      return undefined;
    }

    const { hash, outputs, confirmed } = finalTx;

    // 받는 사람이 toAddress이고, 금액이 0보다 큰 output을 찾습니다.
    const relevantOutput = outputs.find(
      (out) => out.addresses.includes(toAddress) && out.value.isGreaterThan(0),
    );

    // 만약 해당하는 output이 없다면 유효한 입금이 아님
    if (!relevantOutput) {
      logger.warn(
        `[BTC] Transaction ${hash} found, but no valid output for address ${toAddress}`,
      );
      return undefined;
    }

    return {
      chainType: "BTC",
      cryptoType: "BTC",
      fromAddress: fromAddress,
      toAddress: toAddress,
      cryptoAmount: relevantOutput.value.toString(),
      status: "CONFIRMED",
      decimals: 8, // BTC는 항상 8
      acceptedAt: DateTime.fromMillis(new Date(confirmed).getTime())
        .setZone("Asia/Seoul")
        .toMillis(),
      memo: `tx:${hash}`,
    };
  } catch (error) {
    logger.error("Error finding latest transfer:", error);
    return undefined;
  }
}

export async function BtcTransfer(
  address: string,
): Promise<NormalizedTransfer[] | undefined> {
  try {
    // 1) 주소 요약
    const info = await getBTCTransferList(address);
    const hashes = Array.from(
      new Set(info.txrefs?.map((t) => t.tx_hash) ?? []),
    );
    if (hashes.length === 0) return undefined;

    // 2) 상세 병렬 조회 (최대 100건)
    const TARGET = 1;
    const detailed = await Promise.all(
      hashes.slice(0, TARGET).map(getBTCTransactionDetail),
    );

    // 3) 최신순 정렬 (confirmed 없으면 received 사용)
    detailed.sort(
      (a, b) =>
        Date.parse(b.confirmed ?? b.received ?? "0") -
        Date.parse(a.confirmed ?? a.received ?? "0"),
    );

    // 4) 우리 주소 관점으로 from/to + 금액 계산 후 DTO 매핑
    return detailed.map((tx) => {
      const spent = (tx.inputs ?? [])
        .filter((i) => (i.addresses ?? []).includes(address))
        .reduce((sum, i: any) => sum + (i.output_value ?? 0), 0); // satoshis

      const received = (tx.outputs ?? [])
        .filter((o) => (o.addresses ?? []).includes(address))
        .reduce((sum, o: any) => sum + (o.value ?? 0), 0); // satoshis

      const net = received - spent; // >0 수신, <0 송신
      const inbound = net >= 0;

      const inAddrs = (tx.inputs ?? []).flatMap((i) => i.addresses ?? []);
      const outAddrs = (tx.outputs ?? []).flatMap((o) => o.addresses ?? []);

      const fromAddress = inbound
        ? (inAddrs.find((a) => a !== address) ?? "multiple")
        : address;

      const toAddress = inbound
        ? address
        : (outAddrs.find((a) => a !== address) ?? "multiple");

      const iso = tx.confirmed ?? tx.received ?? new Date(0).toISOString();

      return {
        chainType: "BTC",
        cryptoType: "BTC",
        fromAddress,
        toAddress,
        cryptoAmount: String(Math.abs(net)), // 사토시 문자열(해석: decimals=8)
        status: (tx.confirmations ?? 0) > 0 ? "CONFIRMED" : "PENDING",
        decimals: 8, // BTC 고정
        acceptedAt: DateTime.fromISO(iso).setZone("Asia/Seoul").toMillis(),
        memo: `tx:${tx.hash}`,
      };
    }); // ← 잊지 말기!
  } catch (error) {
    logger.error("Error finding BTC transfers:", error);
    return undefined;
  }
}

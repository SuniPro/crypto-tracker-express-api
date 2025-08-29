import express from "express";
import { BtcTransfer } from "../utils/bitcoin";
import { EthTransfer } from "../utils/alchemy";
import { TronTransfer } from "../utils/tron";

const router = express.Router();

export type NormalizedTransfer = {
  chainType: string;
  cryptoType: string | null; // 예: "ETH" | "USDT"
  fromAddress: string;
  toAddress: string | null;
  cryptoAmount: string | null; // 사람이 읽는 단위 (ETH 또는 토큰 단위)
  status: string;
  decimals: number | null; // 18(ETH) 또는 토큰 decimals (모르면 null)
  acceptedAt: number; // Asia/Seoul 기준 millis
  memo: string; // 예: "success"
};

router.get("/get", async (req, res, next) => {
  try {
    const chainTypeRaw = req.query.chain;
    const addressRaw = req.query.address;

    // 기본 검증
    if (typeof chainTypeRaw !== "string" || typeof addressRaw !== "string") {
      return res
        .status(400)
        .json({ error: "chainType and address are required" });
    }
    const chainType = chainTypeRaw.toUpperCase();
    const address = addressRaw.trim();
    if (!address) {
      return res.status(400).json({ error: "address must be non-empty" });
    }

    switch (chainType) {
      case "BTC": {
        const result = await BtcTransfer(address);
        return res.json(result ?? []); // 바로 반환(여기서 종료)
      }
      case "ETH": {
        const result = await EthTransfer(address);
        return res.json(result ?? []);
      }
      case "TRON": {
        const result = await TronTransfer(address);
        return res.json(result ?? []);
      }
      default: {
        return res
          .status(400)
          .json({ error: `Unsupported chainType: ${chainType}` });
      }
    }
  } catch (err) {
    return next(err);
  }
});

export default router;

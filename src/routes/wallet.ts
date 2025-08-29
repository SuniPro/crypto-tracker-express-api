import express from "express";
import { btcGetBalance } from "../utils/bitcoin";
import { ethGetBalance } from "../utils/alchemy";
import { tronGetBalance } from "../utils/tron";

export interface BalanceResponseType {
  balance: string;
}

const router = express.Router();

router.get("/get", async function (req, res, next) {
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
        const result = await btcGetBalance(address);
        return res.json(result);
      }
      case "ETH": {
        const result = await ethGetBalance(address);
        return res.json(result);
      }
      case "TRON": {
        const result = await tronGetBalance(address);
        return res.json(result);
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

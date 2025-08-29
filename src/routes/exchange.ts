import express from "express";
import { getCryptoExchangeInfo } from "../utils/exchange";
import logger from "../config/logger";

const router = express.Router();

router.get("/get", async function (req, res, next) {
  const { cryptoType } = req.query as {
    cryptoType: string;
  };

  logger.info({ message: `Exchange rate with ${cryptoType}` });

  try {
    const result = await getCryptoExchangeInfo(
      cryptoType as "USDT" | "BTC" | "ETH",
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;

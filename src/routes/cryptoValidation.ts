import express from "express";
import {
  ethChainValidation,
  EthFindLatestTransferToAddress,
} from "../utils/alchemy";
import {
  tronChainValidation,
  TronFindLatestTransferToAddress,
} from "../utils/tron";
import logger from "../config/logger";
import {
  btcChainValidation,
  BtcFindLatestTransferToAddress,
} from "../utils/bitcoin";

const router = express.Router();

router.get("/get/tron", async function (req, res, next) {
  const { wallet } = req.query as {
    wallet: string;
  };

  try {
    const result = await tronChainValidation(wallet);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get("/get/eth", async function (req, res, next) {
  const { wallet } = req.query as {
    wallet: string;
  };

  try {
    const result = await ethChainValidation(wallet);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get("/get/btc", async function (req, res, next) {
  const { wallet } = req.query as {
    wallet: string;
  };

  try {
    const result = await btcChainValidation(wallet);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/* GET home page. */
router.get("/get/transfer/tron", async function (req, res, next) {
  const { fromAddress, toAddress, requestedAt } = req.query as {
    fromAddress: string;
    toAddress: string;
    requestedAt: string;
  };

  const requestedAtParse = parseInt(requestedAt, 10);

  logger.info(
    "FromAddress : " +
      fromAddress +
      " to Address : " +
      toAddress +
      "RequestedAt" +
      requestedAt,
  );

  try {
    const result = await TronFindLatestTransferToAddress(
      fromAddress,
      toAddress,
      requestedAtParse,
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get("/get/transfer/eth", async function (req, res, next) {
  try {
    const { fromAddress, toAddress, requestedAt } = req.query as {
      fromAddress: string;
      toAddress: string;
      requestedAt: string;
    };

    const requestedAtParse = parseInt(requestedAt, 10);

    logger.info(
      "FromAddress : " + fromAddress + " to Address : " + toAddress,
      "RequestedAt" + requestedAt,
    );

    const data = await EthFindLatestTransferToAddress(
      fromAddress,
      toAddress,
      requestedAtParse,
    );
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.get("/get/transfer/btc", async function (req, res, next) {
  try {
    const { fromAddress, toAddress, requestedAt } = req.query as {
      fromAddress: string;
      toAddress: string;
      requestedAt: string;
    };

    const requestedAtParse = parseInt(requestedAt, 10);

    logger.info(
      "FromAddress : " + fromAddress + " to Address : " + toAddress,
      "RequestedAt" + requestedAt,
    );

    const data = await BtcFindLatestTransferToAddress(
      fromAddress,
      toAddress,
      requestedAtParse,
    );
    res.json(data);
  } catch (error) {
    next(error);
  }
});

export default router;

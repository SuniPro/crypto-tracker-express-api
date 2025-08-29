import createError, { HttpError } from "http-errors";
import express, { Express, Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import logger from "morgan";

import exchange from "./routes/exchange";
import cryptoValidation from "./routes/cryptoValidation";
import transfer from "./routes/transfer";
import wallet from "./routes/wallet";

const port = process.env.PORT || 3000;

const app: Express = express();

app.use(logger("dev"));
app.use(express.json()); // JSON 요청 본문을 파싱하기 위해 필수
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// === 라우터 설정 ===
app.use("/validation", cryptoValidation);
app.use("/exchange", exchange);
app.use("/transfer", transfer);
app.use("/wallet", wallet);

// === 404 에러 처리 ===
app.use((req: Request, res: Response, next: NextFunction) => {
  next(createError(404, "Not Found")); // 404 에러 발생
});

// === 모든 에러 처리 ===
app.use((err: HttpError, req: Request, res: Response, next: NextFunction) => {
  // API 서버이므로 JSON 형태로 에러 응답
  res.status(err.status || 500);
  res.json({
    error: {
      message: err.message,
      // 개발 환경에서만 스택 트레이스를 포함
      stack: req.app.get("env") === "development" ? err.stack : undefined,
    },
  });
});

app.listen(port, () => {
  console.log(`🚀 Server is listening on port ${port}`);
});

export default app;

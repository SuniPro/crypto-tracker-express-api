import winston from "winston";

const { combine, timestamp, printf, colorize } = winston.format;

// 로그 출력 형식 정의
const logFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} ${level}: ${message}`;
});

const logger = winston.createLogger({
  // 로그 레벨 설정: 'info' 레벨 이상의 로그만 출력
  level: "info",

  // 로그 형식 설정
  format: combine(timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), logFormat),

  // 로그를 어디에 출력할지(Transport) 설정
  transports: [
    // 개발 환경에서는 색상이 들어간 로그를 콘솔에 출력
    new winston.transports.Console({
      format: combine(colorize(), logFormat),
    }),

    // 운영 환경에서는 파일로도 로그를 남길 수 있음
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    new winston.transports.File({ filename: "logs/combined.log" }),
  ],
});

export default logger;

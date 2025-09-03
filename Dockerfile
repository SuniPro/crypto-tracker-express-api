# First Stage: Build
FROM node:22 AS build

WORKDIR /app

# 1. 패키지 복사
COPY package.json pnpm-lock.yaml ./

# 🔥 2. file: 경로로 참조되는 tron 디렉토리도 미리 복사
COPY .api/apis/tron ./api/apis/tron

# 3. 의존성 설치
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# 4. 나머지 복사
COPY . .
COPY .env.production .env

# 5. 빌드
RUN pnpm run build

# Stage 2: Run
FROM node:22

WORKDIR /app

# pnpm 설치 및 앱 파일 복사
RUN npm install -g pnpm

COPY --from=build /app /app

EXPOSE 3000

CMD ["pnpm", "start"]

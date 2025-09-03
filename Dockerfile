# First Stage: Build
FROM node:22 AS build

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY .env.production .env
COPY . .

RUN pnpm run build

# Stage 2: Run
FROM node:22

WORKDIR /app

# pnpm 설치 및 앱 파일 복사
RUN npm install -g pnpm

COPY --from=build /app /app

EXPOSE 3000

CMD ["pnpm", "start"]

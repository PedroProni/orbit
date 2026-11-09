# -------- Stage 1: Build --------
FROM node:20-slim AS builder

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm i

COPY . .

RUN npm run build && \
    mkdir -p dist/infrastructure/documentation/config && \
    cp src/infrastructure/documentation/config/description.txt dist/infrastructure/documentation/config/description.txt

# -------- Stage 2: Production --------
FROM node:20-slim

RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/package*.json ./
RUN npm i --omit=dev

COPY --from=builder /usr/src/app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main.js"]

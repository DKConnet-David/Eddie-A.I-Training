# ── Stage 1: Build ──
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# ── Stage 2: Production ──
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev || npm install --omit=dev

COPY server.js .
COPY --from=build /app/dist ./dist

# Create data directory
RUN mkdir -p /data

EXPOSE 3008

CMD ["node", "server.js"]

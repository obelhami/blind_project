# Stage 1: build frontend
FROM node:20-alpine AS frontend
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY index.html vite.config.js tailwind.config.js postcss.config.js ./
COPY src ./src
RUN npm run build

# Stage 2: server + serve frontend
FROM node:20-alpine
RUN apk add --no-cache python3 make g++

WORKDIR /app/server

COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev

COPY server/ ./
COPY --from=frontend /app/dist ./public

EXPOSE 3001
ENV NODE_ENV=production
CMD ["node", "index.js"]

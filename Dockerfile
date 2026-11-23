FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY index.html vite.config.js ./
COPY src ./src
RUN npm run build
FROM node:22-bookworm-slim
ENV NODE_ENV=production PORT=80 DB_FILE=/app/data/parking.sqlite
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && mkdir -p data && chown -R node:node /app
COPY server ./server
COPY --from=build /app/dist ./dist
USER node
EXPOSE 80
CMD ["node","server/index.js"]

# API server for Cloud Run (Firebase Hosting rewrites /api/** here).
# Builds app inside the image so Cloud Build doesn't need to upload dist/.
FROM node:20-slim
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

CMD ["node", "dist/index.cjs"]

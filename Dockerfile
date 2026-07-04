# Railway's Nixpacks V3 builder pins Node 24 / npm 11.6.1, whose `npm ci`
# falsely fails on optional peerDependencies — and it ignores every version
# knob (NIXPACKS_NODE_VERSION, .nvmrc, nixpacksPlan). A plain Dockerfile
# gives us a deterministic Node 22 build instead.

FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/.output ./.output
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]

FROM node:18-alpine AS base
WORKDIR /app

# Install bun (package manager/runtime)
RUN apk add --no-cache curl bash \
    && curl -fsSL https://bun.sh/install | bash \
    && mv /root/.bun/bin/bun /usr/local/bin/bun

# Install dependencies using bun
COPY package.json bun.lock tsconfig.json ./
RUN bun install
RUN bun add class-transformer

# Copy source and build
COPY . .
RUN bun run build

EXPOSE 3000
# Start application in production
CMD ["bun", "run", "start:prod"]
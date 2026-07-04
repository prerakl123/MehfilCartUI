# syntax=docker/dockerfile:1
# MehfilCart UI -- Next.js dev server.
FROM node:22-alpine

WORKDIR /app

# Install dependencies first for layer caching.
COPY package.json package-lock.json ./
RUN npm ci

# Copy the application source.
COPY . .

EXPOSE 3000

# Dev server with hot reload, listening on all interfaces so the host can reach it.
# NEXT_PUBLIC_* values are supplied at runtime via compose environment.
CMD ["npm", "run", "dev", "--", "-H", "0.0.0.0"]

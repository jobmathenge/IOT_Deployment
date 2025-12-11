# frontend/Dockerfile

# --- Stage 1: Dependency Installation ---
FROM node:20-alpine AS deps
WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy lock files and install dependencies
COPY package.json pnpm-lock.yaml ./ 
RUN pnpm install --frozen-lockfile


# --- Stage 2: Builder Stage ---
FROM node:20-alpine AS builder
WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy dependencies and source code
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variable for build time
ENV NEXT_PUBLIC_API_URL=http://backend:3001 
ENV NODE_ENV production

# Build the application (ensures next.config.js has output: 'standalone')
RUN pnpm run build 


# --- Stage 3: Production Server (Runner) ---
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV PORT 3000 # Explicitly set the port for the Next.js server

# Install pnpm globally (in case of deep dependency resolution needs)
RUN npm install -g pnpm 

# Copy Next.js production server files (standalone output already includes necessary node_modules)
COPY --from=builder /app/.next/standalone ./ 
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/static ./.next/static

# Expose the port
EXPOSE 3000

# Command to run the production server
CMD ["node", "server.js"]
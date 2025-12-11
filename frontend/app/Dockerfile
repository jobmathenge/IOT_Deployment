# --- Stage 1: Dependency Installation ---
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --frozen-lockfile


# --- Stage 2: Builder Stage ---
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variable for build time
# Replace YOUR_BACKEND_URL with the service name from docker-compose
ENV NEXT_PUBLIC_API_URL=http://backend:3001

# Build the application
RUN npm run build


# --- Stage 3: Production Server ---
FROM node:20-alpine AS runner
WORKDIR /app

# Set the node environment to production
ENV NODE_ENV production

# Copy the necessary files for the runtime
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Expose the port (Next.js default)
EXPOSE 3000

# Command to run the production server
CMD ["node", "server.js"]
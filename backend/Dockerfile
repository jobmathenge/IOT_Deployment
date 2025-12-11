# --- STAGE 1: BUILD (Compiling TypeScript to JavaScript) ---
FROM node:20-alpine AS builder

# Set the working directory
WORKDIR /app

# Copy package files first to leverage Docker cache
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the source code
COPY . .

# Build the NestJS application (compiles TypeScript to dist/js)
# NOTE: Assumes your build command is 'npm run build'
RUN npm run build


# --- STAGE 2: PRODUCTION (Running the application) ---
FROM node:20-alpine AS production

# Set the working directory
WORKDIR /app

# Copy production dependencies only
COPY package*.json ./
RUN npm install --only=production

# Copy built application files from the builder stage
COPY --from=builder /app/dist ./dist

# Copy crucial production files (e.g., ORM configs, environment variables)
# The .env file is CRUCIAL for JWT_SECRET and Database connection
# You should ensure your production environment provides these secrets securely!
COPY .env ./.env 

# Expose the port (NestJS usually runs on 3000 by default)
EXPOSE 3001

# Command to run the application
CMD [ "node", "dist/main.js" ]
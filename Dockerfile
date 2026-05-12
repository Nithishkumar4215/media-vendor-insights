# Multi-stage build for production
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY backend/package*.json ./backend/

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the React app
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Copy built frontend
COPY --from=builder /app/dist ./dist

# Copy backend files
COPY --from=builder /app/backend ./backend
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Create uploads directory
RUN mkdir -p ./backend/uploads

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the server
CMD ["npm", "run", "server"]

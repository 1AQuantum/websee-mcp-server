# Production-ready Docker image for WebSee Source Intelligence
FROM mcr.microsoft.com/playwright:v1.49.0-jammy

# Set working directory
WORKDIR /app

# Install additional browsers if needed
RUN npx playwright install chromium firefox webkit

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the project
RUN npm run build

# Create a non-root user
RUN useradd -m -s /bin/bash websee && \
    chown -R websee:websee /app

USER websee

# Expose any ports if needed (optional)
# EXPOSE 3000

# Default command
CMD ["node", "dist/index.js"]
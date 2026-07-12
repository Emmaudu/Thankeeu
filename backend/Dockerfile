# Dockerfile for Thankeeu backend on Railway
# Uses Node 20 Alpine with ffmpeg installed explicitly
FROM node:20-alpine

# Install ffmpeg (required for Memory Movie generation)
RUN apk add --no-cache ffmpeg

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --production

# Copy source
COPY . .

# Start
CMD ["node", "server.js"]

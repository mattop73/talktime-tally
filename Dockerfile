# Use Node.js 18 Alpine for smaller image size
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies first (for better caching)
COPY package.json package-lock.json ./
RUN npm ci --only=production=false --cache /tmp/.npm

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Set environment variable to disable host checking
ENV VITE_HOST_CHECK=false

# Expose the port that Vite preview runs on
EXPOSE 4173

# Start the application
CMD ["npm", "run", "start"]

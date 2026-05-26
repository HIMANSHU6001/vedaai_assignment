# frontend/Dockerfile
FROM node:22-alpine

WORKDIR /app

# Install dependencies first (caching this layer)
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Set environment variable for development
ENV NODE_ENV=development

EXPOSE 3000

# Start the Next.js development server
CMD ["npm", "run", "dev"]
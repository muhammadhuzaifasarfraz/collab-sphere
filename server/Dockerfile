# Use a base image with Node.js and build tools for native modules like bcrypt
FROM node:18-slim as base

# Install packages needed for bcrypt (compiler tools, Python, etc.)
# We use 'apt-get update' and 'apt-get install -y' in a single command for efficiency
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    python3 \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to leverage Docker layer caching
COPY package*.json ./

# Install dependencies, including native modules
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port the server listens on (e.g., 5000)
# **Adjust the port number if your server uses a different one**
EXPOSE 5000

# Command to run the application
CMD [ "npm", "start" ]
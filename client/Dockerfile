# Stage 1: Build the React application
FROM node:18-slim as build

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the app for production (creates the 'build' folder)
RUN npm run build

# Stage 2: Serve the application using Nginx
FROM nginx:alpine

# Copy the built files from the build stage to Nginx's HTML directory
COPY --from=build /app/build /usr/share/nginx/html

# Copy a custom Nginx configuration to handle client-side routing (crucial for React apps)
# Create the 'nginx.conf' file in the client directory first (see step 2C)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose the default Nginx port
EXPOSE 80

# Command to start Nginx
CMD ["nginx", "-g", "daemon off;"]
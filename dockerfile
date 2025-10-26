# Build stage
FROM node:22.15-alpine AS builder
WORKDIR /app

# Copy package files and submodules (needed for npm install)
COPY package.json package-lock.json* ./
COPY submodules/streamer/v2 ./submodules/streamer/v2

# Install dependencies
RUN npm install

# Copy only necessary source files
COPY src ./src
COPY public ./public
COPY index.html vite.config.js tailwind.config.js postcss.config.js eslint.config.js ./
COPY staging.env .env

# Build main app
RUN npm run build

# Build streamer/v2
WORKDIR /app/submodules/streamer/v2
RUN npm install
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY --from=builder /app/submodules/streamer/v2/build /usr/share/nginx/html/embed
COPY --from=builder /app/submodules/streamer/v2/build/thumbnails /usr/share/nginx/html/thumbnails
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
# Build stage
FROM node:22.15-alpine as builder

# First build the inception-stream-component
WORKDIR /inception-stream-component
COPY inception-stream-component/package.json ./
COPY inception-stream-component/package-lock.json* ./
RUN npm install --legacy-peer-deps
COPY inception-stream-component/ ./
RUN npm run build

# Now build the main app
WORKDIR /app
COPY aos-inception-console/package.json aos-inception-console/package-lock.json* ./
RUN npm install
COPY aos-inception-console/ ./
COPY aos-inception-console/staging.env .env
RUN npm run build

# Serve the built app with nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY aos-inception-console/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
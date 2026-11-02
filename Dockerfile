FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
RUN apk add --no-cache gettext
COPY --from=build /app/dist/bolono/browser /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/default.conf.template
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh
EXPOSE 8080
CMD ["/app/docker-entrypoint.sh"]

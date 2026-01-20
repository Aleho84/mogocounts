# Stage 1: Build
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Copiar build de React
COPY --from=build /app/dist .

# Copiar conf nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 4001

CMD ["nginx", "-g", "daemon off;"]

FROM node:latest as build
WORKDIR /app
ADD package.json .npmrc  ./
ENV NPM_CONFIG_LOGLEVEL warn
RUN npm install
ADD pages ./pages
ADD next.config.js ./
RUN NODE_ENV=production npm run build
RUN NODE_ENV=production npm run static

FROM nginx:latest AS production
RUN mkdir -p /usr/share/nginx/html
WORKDIR /usr/share/nginx/html
COPY --from=build /app/out .

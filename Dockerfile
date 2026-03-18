ARG node=24.14-slim
ARG nginx=1.29

FROM node:${node} AS tt-builder-node
RUN apt update -y
RUN apt-get clean
WORKDIR /app
COPY *.json .
COPY *.js .
COPY src src
RUN npm ci
RUN npm run build

FROM nginx:${nginx}
WORKDIR /app
COPY --from=tt-builder-node /app/dist/ /var/www/
COPY conf/docker/nginx/default.conf /etc/nginx/templates/default.conf.template
EXPOSE 80
ENV NGINX_ENTRYPOINT_QUIET_LOGS=1
HEALTHCHECK --interval=60m --timeout=3s CMD curl -f http://localhost/ || exit 1

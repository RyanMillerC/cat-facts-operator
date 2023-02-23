# Run `yarn build` before building this container image

FROM quay.io/cajieh0/nginx:stable

COPY ./dist /usr/share/nginx/html

RUN chmod g+rwx /var/cache/nginx /var/log/nginx /var/run

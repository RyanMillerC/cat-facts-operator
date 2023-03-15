# Run `yarn build` before building this container image

FROM quay.io/cajieh0/nginx:stable

COPY ./dist /usr/share/nginx/html

# This image will not run without a TLS certificate and key injected into
# /var/cert. The OpenShift service and deployment will handle this
# automatically. If for some reason you need to test this outside of OpenShift,
# either mount a certificate/key pair or remove this section.
COPY ./nginx.conf /etc/nginx/nginx.conf

RUN chmod g+rwx /etc/nginx/nginx.conf /var/cache/nginx /var/log/nginx /var/run

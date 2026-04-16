FROM registry.access.redhat.com/ubi9/nginx-120:latest

COPY dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
USER 1001

ENTRYPOINT ["nginx", "-g", "daemon off;"]

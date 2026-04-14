FROM registry.access.redhat.com/ubi9/nginx-120:latest

COPY dist /usr/share/nginx/html
USER 1001

ENTRYPOINT ["nginx", "-g", "daemon off;"]

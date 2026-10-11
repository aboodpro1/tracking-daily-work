# Production image: static site served by Nginx
FROM nginx:1.27-alpine

# Nginx site configuration
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf

# Ship only the web root (src/) — docs, workflows and tooling stay out of the image
WORKDIR /usr/share/nginx/html
RUN rm -rf ./*
COPY src/ ./

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

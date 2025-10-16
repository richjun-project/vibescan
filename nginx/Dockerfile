FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Create directory for Let's Encrypt challenges
RUN mkdir -p /var/www/certbot

# Expose ports
EXPOSE 80 443

# Start nginx with envsubst for environment variable substitution
CMD ["/bin/sh", "-c", "envsubst '$$DOMAIN' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]

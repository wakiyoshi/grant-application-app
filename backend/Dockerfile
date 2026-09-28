FROM composer:2 AS vendor
WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-interaction --no-progress --prefer-dist --no-scripts
COPY . .
RUN composer dump-autoload --no-dev --classmap-authoritative --no-interaction

FROM php:8.4-apache
ENV APACHE_DOCUMENT_ROOT=/var/www/html/public \
    APP_PORT=8080
COPY docker/apache-laravel.conf /etc/apache2/conf-available/laravel.conf
COPY docker/uploads.ini /usr/local/etc/php/conf.d/uploads.ini
RUN docker-php-ext-install pdo_mysql \
    && a2enmod rewrite headers \
    && a2enconf laravel \
    && sed -ri 's!Listen 80!Listen 8080!' /etc/apache2/ports.conf \
    && sed -ri 's!<VirtualHost \*:80>!<VirtualHost *:8080>!' /etc/apache2/sites-available/*.conf \
    && sed -ri 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
WORKDIR /var/www/html
COPY --from=vendor /app .
RUN chown -R www-data:www-data storage bootstrap/cache
EXPOSE 8080
CMD ["apache2-foreground"]

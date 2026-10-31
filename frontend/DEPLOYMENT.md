# Deployment Guide - Hisab Ledger Frontend

## Pre-Deployment Checklist

- [ ] All features tested locally
- [ ] No console errors in DevTools
- [ ] Environment variables configured
- [ ] Backend API is accessible from production domain
- [ ] CORS headers configured in Django
- [ ] Database backups created
- [ ] Sensitive data not in code/git

## Building for Production

### 1. Build Optimized Bundle
```bash
npm run build
```

This creates:
- `dist/index.html` - HTML template
- `dist/assets/` - Bundled JS, CSS, images
- All files minified and optimized

### 2. Verify Build
```bash
npm run preview
```

Test the production build locally before deploying.

### 3. Check Bundle Size
```bash
# Analyze bundle (install analyzer first)
npm install --save-dev rollup-plugin-visualizer
# Update vite.config.ts to use plugin
npm run build
```

## Environment Configuration

### Production Environment Variables

Create `.env.production`:
```bash
# Production API URL
VITE_API_URL=https://api.yourdomain.com/api

# Optional: Enable analytics
VITE_ANALYTICS_ID=your_analytics_id
```

### Environment Switching
The app automatically uses the correct environment based on `NODE_ENV`:
- `development` - Uses `VITE_API_URL` from `.env`
- `production` - Uses `VITE_API_URL` from `.env.production`

## Deployment Options

### Option 1: Static Hosting (Recommended)

#### Vercel (Easiest)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard:
# VITE_API_URL=https://your-api.com/api
```

#### Netlify
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod

# Or use Git integration (recommended)
# Push to GitHub, GitLab, or Bitbucket
# Netlify auto-deploys on push
```

#### GitHub Pages
```bash
# For subdirectory deployment
# Update vite.config.ts: base: '/ledger-frontend/'

npm run build

# Push dist folder to gh-pages branch
git subtree push --prefix dist origin gh-pages
```

### Option 2: Docker Deployment

Create `Dockerfile`:
```dockerfile
# Build stage
FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Serve stage
FROM node:18-alpine

WORKDIR /app

RUN npm install -g serve

COPY --from=build /app/dist ./dist

ENV VITE_API_URL=http://localhost:8000/api

EXPOSE 3000

CMD ["serve", "-s", "dist", "-l", "3000"]
```

Build and run:
```bash
# Build image
docker build -t hisab-ledger-frontend .

# Run container
docker run -p 3000:3000 \
  -e VITE_API_URL=https://api.yourdomain.com/api \
  hisab-ledger-frontend
```

### Option 3: Traditional Web Server

#### Nginx Configuration
```nginx
server {
    listen 80;
    server_name ledger.yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ledger.yourdomain.com;

    # SSL certificates
    ssl_certificate /etc/ssl/certs/cert.pem;
    ssl_certificate_key /etc/ssl/private/key.pem;

    root /var/www/hisab-ledger-frontend/dist;

    # Serve static files
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA routing - send all routes to index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
}
```

#### Apache Configuration
```apache
<VirtualHost *:443>
    ServerName ledger.yourdomain.com
    
    DocumentRoot /var/www/hisab-ledger-frontend/dist

    # Enable HTTPS
    SSLEngine on
    SSLCertificateFile /etc/ssl/certs/cert.pem
    SSLCertificateKeyFile /etc/ssl/private/key.pem

    # Enable mod_rewrite
    <Directory /var/www/hisab-ledger-frontend/dist>
        RewriteEngine On
        RewriteBase /
        
        # Don't rewrite actual files or directories
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        
        # Route all requests to index.html for SPA
        RewriteRule ^ index.html [QSA,L]
    </Directory>

    # Set security headers
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-XSS-Protection "1; mode=block"
</VirtualHost>
```

#### AWS S3 + CloudFront

1. **Build the app:**
   ```bash
   npm run build
   ```

2. **Upload to S3:**
   ```bash
   aws s3 sync dist/ s3://your-bucket-name/ --delete
   ```

3. **Create CloudFront distribution:**
   - Origin: Your S3 bucket
   - Default root object: `index.html`
   - Redirect `/index.html` for missing files

4. **Set environment:**
   ```bash
   # Create .env.production before building
   VITE_API_URL=https://api.yourdomain.com/api
   npm run build
   ```

## CORS Configuration (Django)

For the frontend to access your API, configure CORS in Django:

```python
# settings.py
INSTALLED_APPS = [
    # ...
    'corsheaders',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    # ...
]

# Allow frontend domain
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",  # Development
    "https://ledger.yourdomain.com",  # Production
]

# Or allow all (not recommended for production)
CORS_ALLOW_ALL_ORIGINS = False
```

## SSL/TLS Certificate

### Let's Encrypt (Free)
```bash
# Using Certbot
sudo apt-get install certbot python3-certbot-nginx

# Generate certificate
sudo certbot certonly --nginx -d ledger.yourdomain.com

# Auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

## Performance Optimization

### 1. Enable Gzip Compression
**Nginx:**
```nginx
gzip on;
gzip_types text/plain text/css application/javascript;
gzip_min_length 1000;
```

**Apache:**
```apache
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/xml
    AddOutputFilterByType DEFLATE text/css text/javascript application/javascript
</IfModule>
```

### 2. Enable Caching
Set cache headers for static assets (already in nginx/apache configs above)

### 3. CDN Integration
Use a CDN like CloudFlare for:
- DDoS protection
- Global caching
- Automatic optimization
- Free SSL

### 4. Monitor Performance
- Use Lighthouse: `npm run build && npm run preview`
- Check Core Web Vitals
- Monitor uptime with Pingdom or StatusCake

## Monitoring & Maintenance

### Error Tracking
Add error tracking service (optional):
```typescript
// In main.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: import.meta.env.MODE,
});
```

### Logging
Monitor API calls and user actions:
- Use browser DevTools network tab
- Check server logs for API errors
- Monitor 404 errors (missing routes)

### Updates
Keep dependencies current:
```bash
# Check for updates
npm outdated

# Update packages
npm update

# Test after update
npm run build
```

## Rollback Plan

If deployment fails:

1. **Revert to previous version:**
   ```bash
   # Using Git
   git revert <commit-hash>
   npm run build
   # Deploy again
   ```

2. **Keep previous build:**
   - Store previous `dist` folder as backup
   - Simple switch back in web server config

3. **Database considerations:**
   - Frontend doesn't store data (stateless)
   - No database migrations needed
   - API compatibility matters

## Security Checklist

- [ ] HTTPS enabled (SSL/TLS)
- [ ] Security headers configured
- [ ] CORS properly restricted
- [ ] API keys/secrets not in frontend code
- [ ] Environment variables not in git
- [ ] CSP (Content Security Policy) configured
- [ ] No hardcoded API URLs
- [ ] Regular dependency updates
- [ ] Monitoring enabled
- [ ] Backup strategy in place

## Troubleshooting Deployment

### Blank Page After Deploy
- Check browser console for errors
- Verify environment variables set
- Check API URL is reachable
- Clear browser cache

### API Not Accessible
- Check CORS headers from Django
- Verify API URL in environment variables
- Check firewall rules
- Verify SSL certificate is valid

### Static Assets 404
- Check build output: `npm run build`
- Verify all assets in `dist/` folder
- Check web server configuration
- Verify base URL in vite.config.ts

### Performance Issues
- Check bundle size: `npm run build`
- Enable gzip compression
- Use CDN for static files
- Monitor API response times

## Support & Monitoring

Recommended tools:
- **Uptime Monitoring:** Pingdom, StatusCake
- **Error Tracking:** Sentry, Rollbar
- **Performance:** New Relic, DataDog
- **Analytics:** Google Analytics, Mixpanel
- **Logs:** CloudWatch, ELK Stack

---

**Need help? Check README.md or QUICKSTART.md**

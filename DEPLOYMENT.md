# SagarSaathi Deployment Guide

This guide covers deployment options for the SagarSaathi platform in production environments.

## Prerequisites

- Node.js 18+ installed
- MongoDB instance (local or MongoDB Atlas)
- Domain name (for production)
- SSL certificates (for HTTPS)
- Environment variables configured

## Environment Configuration

Create a `.env` file in the project root with the following variables:

```bash
# Database
MONGO_URI=mongodb://localhost:27017/sagarsaathi
PORT=5000

# JWT
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=30d

# Twilio (SMS & Calling)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
TWILIO_TWIML_APP_SID=your_twilio_twiml_app_sid

# AWS S3 (Document Storage)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=ap-south-1
S3_BUCKET_NAME=sagarsaathi-documents

# Google Maps
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

## Deployment Methods

### Option 1: Docker Deployment (Recommended)

Docker provides the easiest and most consistent deployment experience.

#### Quick Start

```bash
# Build and start all services
./deploy.sh production docker

# Or manually:
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

#### Docker Services

- **MongoDB**: Database container
- **Backend**: Node.js API server
- **Frontend**: React application
- **Nginx**: Reverse proxy and load balancer

### Option 2: PM2 Deployment

PM2 is ideal for Node.js process management on VPS/dedicated servers.

#### Installation

```bash
# Install PM2 globally
npm install -g pm2

# Deploy with PM2
./deploy.sh production pm2

# Or manually:
cd backend && npm ci --only=production && cd ..
cd frontend && npm ci && npm run build && cd ..
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

#### PM2 Commands

```bash
# View status
pm2 status

# View logs
pm2 logs sagarsaathi-backend

# Restart application
pm2 restart sagarsaathi-backend

# Monitor resources
pm2 monit

# Stop application
pm2 stop sagarsaathi-backend
```

### Option 3: Systemd Deployment

For traditional Linux service management.

#### Setup

```bash
# Deploy with systemd
./deploy.sh production systemd

# Or manually:
sudo cp systemd/sagarsaathi.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable sagarsaathi
sudo systemctl start sagarsaathi
```

#### Systemd Commands

```bash
# Check status
sudo systemctl status sagarsaathi

# View logs
sudo journalctl -u sagarsaathi -f

# Restart service
sudo systemctl restart sagarsaathi

# Stop service
sudo systemctl stop sagarsaathi
```

## Database Setup

### MongoDB Atlas (Cloud)

1. Create a cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a database user
3. Whitelist your server IP
4. Update `MONGO_URI` in `.env` with connection string

### Local MongoDB

```bash
# Install MongoDB
# Ubuntu/Debian
sudo apt install mongodb

# macOS
brew install mongodb-community

# Start MongoDB
sudo systemctl start mongodb   # Linux
brew services start mongodb-community  # macOS

# Create database
mongosh
use sagarsaathi
db.createUser({
  user: "sagarsaathi",
  pwd: "secure_password",
  roles: ["readWrite"]
})
```

## SSL/HTTPS Configuration

### Using Let's Encrypt (Free)

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal (cron job)
sudo certbot renew --dry-run
```

### Nginx Configuration

Update `nginx/nginx.conf`:

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location /api {
        proxy_pass http://backend:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location / {
        proxy_pass http://frontend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Health Monitoring

### Backend Health Endpoint

The backend exposes a health check endpoint:

```bash
curl http://localhost:5000/health
```

### Monitoring Tools

- **PM2 Plus**: Real-time monitoring dashboard
- **Datadog**: Application performance monitoring
- **New Relic**: Full-stack observability
- **Prometheus + Grafana**: Self-hosted monitoring

## Scaling

### Horizontal Scaling (Multiple Servers)

1. Set up a load balancer (Nginx, HAProxy, or cloud LB)
2. Deploy backend on multiple servers
3. Use MongoDB replica set for database redundancy
4. Configure session affinity if needed

### Vertical Scaling (Larger Server)

```bash
# Adjust PM2 instances in ecosystem.config.js
instances: 4,  // Number of CPU cores

# Or set to 'max' for all available cores
instances: 'max',
```

## Backup Strategy

### Database Backups

```bash
# Manual backup
mongodump --uri="mongodb://user:pass@localhost:27017/sagarsaathi" --out=/backup/$(date +%Y%m%d)

# Automated backup (cron)
0 2 * * * mongodump --uri="$MONGO_URI" --out=/backup/$(date +\%Y\%m\%d)
```

### Application Backups

```bash
# Backup uploaded documents
rsync -av backend/uploads/ /backup/uploads/

# Or if using S3, backups are automatic
```

## Rollback Procedure

### Docker

```bash
# Pull previous image
docker-compose down
docker pull sagarsaathi/backend:previous-tag
docker-compose up -d
```

### PM2

```bash
# Rollback to previous git commit
git log --oneline
git checkout <previous-commit-hash>
pm2 reload ecosystem.config.js
```

## Troubleshooting

### Service Won't Start

```bash
# Check logs
docker-compose logs backend  # Docker
pm2 logs sagarsaathi-backend  # PM2
sudo journalctl -u sagarsaathi  # Systemd

# Check environment variables
printenv | grep MONGO_URI

# Verify MongoDB connection
mongosh $MONGO_URI
```

### High Memory Usage

```bash
# Check process memory
pm2 monit  # PM2
docker stats  # Docker

# Adjust max memory in ecosystem.config.js
max_memory_restart: '1G',
```

### API Timeout Issues

```bash
# Check MongoDB performance
mongosh
db.currentOp()

# Add indexes if needed
db.drivers.createIndex({ "location.coordinates": "2dsphere" })
```

## Security Checklist

- [ ] Environment variables secured (not in git)
- [ ] MongoDB authentication enabled
- [ ] SSL/HTTPS configured
- [ ] Firewall configured (allow only necessary ports)
- [ ] Regular security updates applied
- [ ] API rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] JWT secrets are strong and rotated
- [ ] AWS/S3 credentials have minimal permissions
- [ ] Monitoring and alerting configured

## Support

For deployment issues, contact the development team or refer to the main README.md.

## Quick Reference

```bash
# Deploy to production
./deploy.sh production docker

# View logs
docker-compose logs -f       # Docker
pm2 logs                     # PM2
sudo journalctl -f           # Systemd

# Restart services
docker-compose restart       # Docker
pm2 restart all             # PM2
sudo systemctl restart sagarsaathi  # Systemd

# Health check
curl http://localhost:5000/health
```

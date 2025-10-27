#!/bin/bash

# SagarSaathi Deployment Script
# This script handles deployment to production servers

set -e  # Exit on error

echo "🚀 Starting SagarSaathi deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DEPLOY_ENV=${1:-production}
DEPLOY_METHOD=${2:-docker}  # docker, pm2, or systemd

echo -e "${YELLOW}Deployment Environment: ${DEPLOY_ENV}${NC}"
echo -e "${YELLOW}Deployment Method: ${DEPLOY_METHOD}${NC}"

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}Error: .env file not found!${NC}"
    echo "Please create a .env file with required environment variables."
    exit 1
fi

# Load environment variables
export $(grep -v '^#' .env | xargs)

echo -e "${GREEN}✓ Environment variables loaded${NC}"

# Function to deploy with Docker
deploy_docker() {
    echo "📦 Deploying with Docker..."
    
    # Build and start containers
    docker-compose down
    docker-compose build --no-cache
    docker-compose up -d
    
    # Wait for services to be healthy
    echo "⏳ Waiting for services to start..."
    sleep 10
    
    # Check service health
    if docker-compose ps | grep -q "Up"; then
        echo -e "${GREEN}✓ Docker containers are running${NC}"
        docker-compose ps
    else
        echo -e "${RED}✗ Docker deployment failed${NC}"
        docker-compose logs
        exit 1
    fi
}

# Function to deploy with PM2
deploy_pm2() {
    echo "📦 Deploying with PM2..."
    
    # Install dependencies
    echo "📥 Installing backend dependencies..."
    cd backend && npm ci --only=production && cd ..
    
    echo "📥 Installing frontend dependencies..."
    cd frontend && npm ci && cd ..
    
    # Build frontend
    echo "🔨 Building frontend..."
    cd frontend && npm run build && cd ..
    
    # Stop existing PM2 processes
    pm2 stop ecosystem.config.js 2>/dev/null || true
    pm2 delete ecosystem.config.js 2>/dev/null || true
    
    # Start with PM2
    pm2 start ecosystem.config.js --env ${DEPLOY_ENV}
    pm2 save
    
    echo -e "${GREEN}✓ PM2 deployment complete${NC}"
    pm2 status
}

# Function to deploy with systemd
deploy_systemd() {
    echo "📦 Deploying with systemd..."
    
    # Install dependencies
    cd backend && npm ci --only=production && cd ..
    cd frontend && npm ci && npm run build && cd ..
    
    # Copy systemd service file
    sudo cp systemd/sagarsaathi.service /etc/systemd/system/
    sudo systemctl daemon-reload
    sudo systemctl enable sagarsaathi
    sudo systemctl restart sagarsaathi
    
    echo -e "${GREEN}✓ Systemd deployment complete${NC}"
    sudo systemctl status sagarsaathi
}

# Run database migrations if needed
run_migrations() {
    echo "🗄️  Running database migrations..."
    # Add migration commands here if you have any
    echo -e "${GREEN}✓ Migrations complete${NC}"
}

# Health check
health_check() {
    echo "🏥 Performing health check..."
    
    sleep 5
    
    # Check backend health
    if curl -f http://localhost:5000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Backend is healthy${NC}"
    else
        echo -e "${RED}✗ Backend health check failed${NC}"
        return 1
    fi
    
    # Check frontend (if running separately)
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Frontend is accessible${NC}"
    else
        echo -e "${YELLOW}⚠ Frontend not accessible (may be served by backend)${NC}"
    fi
}

# Main deployment logic
case $DEPLOY_METHOD in
    docker)
        deploy_docker
        ;;
    pm2)
        deploy_pm2
        ;;
    systemd)
        deploy_systemd
        ;;
    *)
        echo -e "${RED}Invalid deployment method: ${DEPLOY_METHOD}${NC}"
        echo "Usage: ./deploy.sh [environment] [docker|pm2|systemd]"
        exit 1
        ;;
esac

# Run migrations
run_migrations

# Health check
if health_check; then
    echo -e "${GREEN}🎉 Deployment successful!${NC}"
    echo ""
    echo "Application is now running:"
    echo "  Backend: http://localhost:5000"
    echo "  Frontend: http://localhost:3000"
    echo ""
    echo "To view logs:"
    case $DEPLOY_METHOD in
        docker)
            echo "  docker-compose logs -f"
            ;;
        pm2)
            echo "  pm2 logs sagarsaathi-backend"
            ;;
        systemd)
            echo "  sudo journalctl -u sagarsaathi -f"
            ;;
    esac
else
    echo -e "${RED}❌ Deployment completed but health check failed${NC}"
    exit 1
fi

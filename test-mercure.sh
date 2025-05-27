#!/bin/bash

echo "Testing Mercure Implementation"
echo "=============================="

# Check if .env file exists
if [ ! -f .env ]; then
    echo "ERROR: .env file not found. Please copy .env.example to .env and configure it."
    exit 1
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

echo "1. Checking Mercure JWT Secret is set..."
if [ -z "$MERCURE_JWT_SECRET" ]; then
    echo "ERROR: MERCURE_JWT_SECRET is not set in .env"
    exit 1
else
    echo "✓ MERCURE_JWT_SECRET is configured"
fi

echo ""
echo "2. Checking environment variables..."
echo "   MERCURE_URL: $MERCURE_URL"
echo "   MERCURE_PUBLIC_URL: $MERCURE_PUBLIC_URL"
echo "   MERCURE_CORS_ALLOWED_ORIGINS: $MERCURE_CORS_ALLOWED_ORIGINS"

echo ""
echo "3. Checking Docker services..."
docker-compose ps | grep -E "(mercure|nginx|backend)"

echo ""
echo "4. Testing Mercure health endpoint via Nginx proxy..."
curl -k https://localhost/.well-known/mercure/healthz 2>/dev/null && echo "✓ Mercure health check passed" || echo "✗ Mercure health check failed"

echo ""
echo "5. Testing direct Mercure service (internal)..."
docker-compose exec mercure curl -f http://localhost/.well-known/mercure/healthz 2>/dev/null && echo "✓ Direct Mercure health check passed" || echo "✗ Direct Mercure health check failed"

echo ""
echo "6. Checking Mercure logs for any errors..."
echo "Recent Mercure logs:"
docker-compose logs --tail=10 mercure

echo ""
echo "7. Instructions to test notifications:"
echo "   a) Start all services: docker-compose up -d"
echo "   b) Run migrations: docker-compose exec backend php bin/console doctrine:migrations:migrate"
echo "   c) Login as a restaurant or user"
echo "   d) Create an order (for restaurant notifications) or update order status (for user notifications)"
echo "   e) Check the notification bell in the header"

echo ""
echo "8. To monitor Mercure logs in real-time:"
echo "   docker-compose logs -f mercure"

echo ""
echo "9. To test Mercure subscription manually:"
echo "   # First get a JWT token by logging in, then:"
echo "   curl -N -H 'Cookie: mercure_authorization=YOUR_JWT_TOKEN' \\"
echo "        'https://localhost/.well-known/mercure?topic=/users/1/notifications'"

echo ""
echo "10. Common troubleshooting:"
echo "    - If connection fails, check that all services are running"
echo "    - Verify JWT secret matches between backend and Mercure service"
echo "    - Check browser console for CORS errors"
echo "    - Ensure the JWT token contains proper Mercure claims" 
# Mercure Real-time Notifications Setup

This document explains the Mercure implementation for real-time notifications in BeruFoods.

## Overview

The system uses Mercure for Server-Sent Events (SSE) to deliver real-time notifications to users and restaurants:
- **Restaurants** receive notifications when new orders are placed
- **Users** receive notifications when their order status changes

## Architecture

### Backend (Symfony)
1. **JWT Integration**: User/Restaurant JWT tokens include Mercure claims for topic subscription
2. **Event Listeners**: 
   - `OrderCreationListener`: Sends notifications to restaurants on new orders
   - `OrderStatusUpdateListener`: Sends notifications to users on status changes
3. **API Endpoints**: 
   - `GET /api/notifications` - Fetch user's notifications
   - `PUT /api/notifications/{id}/read` - Mark notification as read
   - `DELETE /api/notifications/clear` - Clear all notifications

### Frontend (React)
1. **AuthContext**: Manages Mercure connection and notification state
2. **NotificationBell**: Component displaying notifications with unread count
3. **Cookie Authentication**: JWT stored as `mercure_authorization` cookie for SSE auth

### Infrastructure
1. **Mercure Hub**: Runs as Docker service, proxied through Nginx
2. **Nginx**: Proxies `/.well-known/mercure` to Mercure service
3. **SSL**: All connections use HTTPS (self-signed cert for dev)

## Configuration

### Environment Variables (.env)
```bash
# Mercure configuration
MERCURE_JWT_SECRET="!ChangeThisToAStrongSecretKey!"  # Shared secret for JWT signing
MERCURE_URL="http://mercure:80/.well-known/mercure"  # Internal URL for backend (Docker service name)
MERCURE_PUBLIC_URL="https://localhost/.well-known/mercure"  # Public URL for frontend
MERCURE_CORS_ALLOWED_ORIGINS="https://localhost http://localhost:5173"
```

### Key Configuration Points
- **Internal vs External URLs**: Backend uses `mercure:80` (Docker service name), frontend uses `localhost` (via Nginx proxy)
- **Cookie Name**: Uses `mercure_authorization` for JWT cookie authentication
- **Development Caddyfile**: Mercure uses `Caddyfile.dev` for development setup
- **Topic Format**: Simple topic names like `/users/1/notifications`, not full URLs

### Docker Services
- **Mercure**: Runs on internal port 80, exposed via Nginx proxy
- **Nginx**: Proxies Mercure at `/.well-known/mercure` with proper SSE headers
- **Backend**: Publishes updates to Mercure hub using internal Docker network
- **Frontend**: Subscribes to topics via EventSource API through Nginx proxy

## Testing

1. **Start services**: `docker-compose up -d`
2. **Run migrations**: `docker-compose exec backend php bin/console doctrine:migrations:migrate`
3. **Test script**: Run `./test-mercure.sh` to verify configuration
4. **Monitor logs**: `docker-compose logs -f mercure`

## Troubleshooting

### Common Issues

1. **"Notification service connection error"**
   - Check if Mercure service is running: `docker-compose ps mercure`
   - Verify JWT secret matches in .env and docker-compose.yml
   - Check browser console for CORS errors
   - Ensure backend uses internal Docker service name (`mercure:80`)

2. **Notifications not appearing**
   - Ensure user is logged in (JWT cookie must be set)
   - Check Mercure logs for subscription errors: `docker-compose logs mercure`
   - Verify topic names are simple paths (e.g., `/users/1/notifications`)
   - Confirm JWT token contains proper Mercure claims

3. **CORS errors**
   - Update `MERCURE_CORS_ALLOWED_ORIGINS` in .env
   - Restart services after changes: `docker-compose restart mercure`

4. **Connection refused errors**
   - Backend should use `http://mercure:80/.well-known/mercure` (internal Docker network)
   - Frontend should use `https://localhost/.well-known/mercure` (via Nginx proxy)

### Debug Commands

```bash
# Check Mercure health via proxy
curl -k https://localhost/.well-known/mercure/healthz

# Check direct Mercure service
docker-compose exec mercure curl -f http://localhost/.well-known/mercure/healthz

# Monitor Mercure subscriptions
docker-compose logs -f mercure | grep "Subscriber"

# Test manual subscription (replace TOKEN)
curl -N -H 'Cookie: mercure_authorization=YOUR_JWT_TOKEN' \
  'https://localhost/.well-known/mercure?topic=/users/1/notifications'

# Check JWT token claims
# Decode your JWT token at jwt.io to verify it contains mercure.subscribe claims
```

## Security Considerations

1. **JWT Secret**: Use a strong, unique secret in production
2. **Topic Authorization**: Topics include user/restaurant ID to prevent unauthorized access
3. **HTTPS Only**: All Mercure connections must use SSL in production
4. **Cookie Security**: JWT cookie uses `SameSite=Lax` and should use `Secure` flag in production
5. **Internal Network**: Backend communicates with Mercure via internal Docker network for security 
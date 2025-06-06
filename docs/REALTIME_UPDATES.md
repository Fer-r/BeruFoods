# Real-time Updates in BeruFoods

This document explains how real-time updates work in the BeruFoods application, focusing on the Mercure integration for push notifications and live updates.

## Overview

BeruFoods uses the [Mercure protocol](https://mercure.rocks/) to provide real-time updates to users. This enables features like:

- Instant order notifications for restaurants
- Live order status updates for customers
- Real-time dashboard updates

## Architecture

The real-time update system consists of three main components:

1. **Mercure Hub**: A server that handles WebSocket-like connections and distributes updates
2. **Publisher (Backend)**: The Symfony backend that publishes updates to the Mercure Hub
3. **Subscriber (Frontend)**: The React frontend that subscribes to updates from the Mercure Hub

```
┌────────────┐     Publish     ┌─────────────┐     Subscribe     ┌────────────┐
│            │ ──────────────> │             │ ──────────────────> │            │
│   Backend  │                 │ Mercure Hub │                    │  Frontend  │
│            │ <────────────── │             │ <────────────────── │            │
└────────────┘   JWT Auth      └─────────────┘    JWT Auth        └────────────┘
```

## JWT Authentication

Mercure uses JWT tokens for both publishing and subscribing:

1. **Publisher JWT**: Used by the backend to publish updates to the Mercure Hub
2. **Subscriber JWT**: Used by the frontend to subscribe to updates from the Mercure Hub

The JWTs contain claims that specify which topics the bearer can publish to or subscribe to.

## Topics

Topics in Mercure are URIs that identify the resource being updated. BeruFoods uses the following topic patterns:

- `/orders/restaurant/{id}`: Updates for a specific restaurant's orders
- `/orders/user/{id}`: Updates for a specific user's orders
- `/order/{id}`: Updates for a specific order

## Implementation Details

### Backend (Publisher)

The backend publishes updates to the Mercure Hub using the Symfony Mercure Bundle:

```php
// Example from NotificationService.php
public function notifyNewOrder(int $orderId, int $restaurantId): bool
{
    // Create notification data
    $data = [
        'type' => 'new_order',
        'orderId' => $orderId,
        'message' => 'New order received'
    ];
    
    // Publish to Mercure hub
    $update = new Update(
        [
            "order/{$orderId}",
            "restaurant/{$restaurantId}/orders"
        ],
        json_encode($data)
    );

    try {
        $this->hub->publish($update);
        return true;
    } catch (\Exception $e) {
        // Error handling
        return false;
    }
}
```

### Frontend (Subscriber)

The frontend subscribes to updates from the Mercure Hub using the EventSource API:

```javascript
// Example from NotificationContext.jsx
useEffect(() => {
  if (!isAuthenticated() || !entity || !mercureToken) {
    return;
  }

  let topics = [];
  if (entity.roles?.includes('ROLE_RESTAURANT') && entity.restaurantId) {
    topics.push(`/orders/restaurant/${entity.restaurantId}`);
  } else if (entity.roles?.includes('ROLE_USER') && entity.userId) {
    topics.push(`/orders/user/${entity.userId}`);
  }

  const url = new URL(MERCURE_PUBLIC_URL);
  topics.forEach(topic => url.searchParams.append('topic', topic));
  
  document.cookie = `mercureAuthorization=${mercureToken}; path=/.well-known/mercure; secure; samesite=strict`;
  
  const es = new EventSource(url);

  es.onmessage = (event) => {
    const data = JSON.parse(event.data);
    addNotification(data);
  };

  return () => {
    es.close();
  };
}, [entity, isAuthenticated, mercureToken, addNotification]);
```

## Security Considerations

1. **JWT Tokens**:
   - Publisher tokens are kept secure on the server
   - Subscriber tokens are generated per user and contain only the topics they should have access to
   - Tokens have a limited lifespan

2. **Topic Design**:
   - Topics are designed to prevent information leakage
   - Users can only subscribe to their own topics
   - Restaurants can only subscribe to their own topics

3. **CORS Configuration**:
   - The Mercure Hub is configured with appropriate CORS headers
   - Only trusted origins can connect to the Mercure Hub

## Notification Types

BeruFoods uses the following notification types:

1. **New Order** (`new_order`):
   - Sent to restaurants when a new order is placed
   - Contains order ID and basic information

2. **Order Status Change** (`order_status_change`):
   - Sent to users when their order status changes
   - Contains order ID, new status, and timestamp

3. **Order Update** (`order_update`):
   - Sent when any other order details are updated
   - Triggers a refresh of the order details

## Handling Offline and Reconnection

The frontend handles connection issues and offline scenarios:

1. **Connection Loss**:
   - EventSource automatically attempts to reconnect
   - Notifications are stored in the database and retrieved when reconnected

2. **Missed Updates**:
   - When reconnecting, the frontend fetches the latest state
   - Persistent notifications ensure no updates are missed

## Testing Real-time Updates

To test the real-time update system:

1. **Setup for Testing**:
   ```bash
   make init          # Initialize the application
   make demo-data     # Create test accounts
   ```

2. **Test Scenario**:
   - Open two browser windows
   - Login as restaurant owner (`restaurant1@example.com` / `password123`) in one window
   - Login as customer (`user1@example.com` / `password123`) in another window
   - Place an order as customer and observe real-time notifications in restaurant dashboard

3. **Local Development Debug**:
   - Ensure the Mercure Hub is running (`docker compose ps mercure`)
   - Check Mercure logs for connection issues (`docker compose logs mercure`)
   - Use browser developer tools to monitor the EventSource connection
   - Access Mercure directly: [http://localhost:3000](http://localhost:3000)

4. **Production**:
   - Monitor Mercure Hub logs
   - Check for CORS or connection issues in browser console
   - Verify JWT token generation and validation

## Troubleshooting

Common issues and solutions:

1. **No Real-time Updates**:
   - Check if the Mercure Hub is running
   - Verify JWT token generation and configuration
   - Check browser console for connection errors
   - Ensure CORS is properly configured

2. **Permission Errors**:
   - Verify JWT claims match the topics being subscribed to
   - Check if the token has expired
   - Ensure the user has the correct roles

3. **Performance Issues**:
   - Limit the number of topics per subscription
   - Optimize the payload size of updates
   - Consider scaling the Mercure Hub for high-traffic scenarios
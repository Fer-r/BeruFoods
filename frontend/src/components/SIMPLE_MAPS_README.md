# Simple Google Maps Setup

This project now uses a simplified Google Maps implementation that **only requires an API key** - no Map ID needed!

## What You Need

Just add this to your `.env` file in the frontend directory:

```env
VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
```

## How to Get an API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Enable these APIs:
   - **Maps JavaScript API**
   - **Places API (New)**
   - **Geocoding API**
4. Go to **Credentials** > **Create Credentials** > **API Key**
5. Copy the API key to your `.env` file

## Components Used

- **`SimpleGoogleMap`**: Uses traditional Google Maps JavaScript API (no advanced features)
- **`ModernGooglePlacesAutocomplete`**: Uses Places API (New) for autocomplete

## Benefits of This Approach

✅ **No Map ID required**  
✅ **No deprecation warnings**  
✅ **Simple setup - just API key**  
✅ **Traditional markers work everywhere**  
✅ **No complex configuration**

## Development vs Production

- **Development**: Add `localhost:5173` to API key restrictions
- **Production**: Add your domain to API key restrictions

---

**That's it!** Just the API key and you're good to go. 🎉 
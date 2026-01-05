// Fix for Leaflet default marker icons in Next.js
// This must be imported before using Leaflet components

// Only execute on client side to avoid SSR issues
if (typeof window !== 'undefined') {
  // Use dynamic require to avoid SSR and type issues
  const L = require('leaflet');
  
  if (L && L.Icon && L.Icon.Default) {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    });
  }
}

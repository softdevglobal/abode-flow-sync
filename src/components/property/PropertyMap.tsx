import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin } from 'lucide-react';

interface PropertyMapProps {
  address: string;
  suburb: string;
  state: string;
  postcode: string;
}

// Approximate coordinates for demo purposes based on suburb
const suburbCoordinates: Record<string, [number, number]> = {
  'Mosman': [151.2446, -33.8293],
  'Surfers Paradise': [153.4290, -28.0027],
  'Paddington': [151.2264, -33.8845],
  'Melbourne': [144.9631, -37.8136],
};

export function PropertyMap({ address, suburb, state, postcode }: PropertyMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapError, setMapError] = useState(false);

  const fullAddress = `${address}, ${suburb} ${state} ${postcode}`;
  const coordinates = suburbCoordinates[suburb] || [151.2093, -33.8688]; // Default to Sydney

  useEffect(() => {
    if (!mapContainer.current) return;

    const token = import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN;
    
    if (!token) {
      setMapError(true);
      return;
    }

    try {
      mapboxgl.accessToken = token;

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: coordinates,
        zoom: 14,
      });

      // Add navigation controls
      map.current.addControl(
        new mapboxgl.NavigationControl({
          visualizePitch: false,
        }),
        'top-right'
      );

      // Add marker for property location
      const marker = document.createElement('div');
      marker.className = 'property-marker';
      marker.innerHTML = `
        <div class="w-10 h-10 bg-accent rounded-full flex items-center justify-center shadow-lg border-2 border-background">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-accent-foreground">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
      `;

      new mapboxgl.Marker({ element: marker })
        .setLngLat(coordinates)
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(
            `<div class="p-2"><strong>${address}</strong><br/>${suburb} ${state} ${postcode}</div>`
          )
        )
        .addTo(map.current);

    } catch (error) {
      console.error('Map initialization error:', error);
      setMapError(true);
    }

    return () => {
      map.current?.remove();
    };
  }, [coordinates, address, suburb, state, postcode]);

  if (mapError) {
    // Fallback to static display
    return (
      <div className="space-y-4">
        <h2 className="font-display text-xl font-semibold flex items-center gap-2">
          <MapPin className="w-5 h-5 text-accent" />
          Location
        </h2>
        <div className="bg-secondary rounded-lg p-6 text-center">
          <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="font-medium">{fullAddress}</p>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline text-sm mt-2 inline-block"
          >
            View on Google Maps →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl font-semibold flex items-center gap-2">
        <MapPin className="w-5 h-5 text-accent" />
        Location
      </h2>
      <div className="rounded-lg overflow-hidden border border-border">
        <div ref={mapContainer} className="h-[300px] w-full" />
        <div className="bg-card p-3 border-t border-border">
          <p className="text-sm text-muted-foreground">{fullAddress}</p>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline text-sm"
          >
            Get directions →
          </a>
        </div>
      </div>
    </div>
  );
}

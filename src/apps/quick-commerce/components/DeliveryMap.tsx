import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const riderIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const storeIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface MapMarker {
  lat: number;
  lng: number;
  label?: string;
  type?: 'default' | 'rider' | 'store';
}

interface DeliveryMapProps {
  center?: [number, number];
  zoom?: number;
  markers?: MapMarker[];
  route?: [number, number][];
  onLocationSelect?: (lat: number, lng: number) => void;
  className?: string;
  height?: string;
}

function LocationPicker({ onSelect }: { onSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

const DeliveryMap: React.FC<DeliveryMapProps> = ({
  center = [27.7172, 85.324],
  zoom = 13,
  markers = [],
  route,
  onLocationSelect,
  className = '',
  height = '400px',
}) => {
  const getIcon = (type?: string) => {
    if (type === 'rider') return riderIcon;
    if (type === 'store') return storeIcon;
    return new L.Icon.Default();
  };

  return (
    <div className={className} style={{ height }}>
      <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%', borderRadius: '0.5rem' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {onLocationSelect && <LocationPicker onSelect={onLocationSelect} />}
        {markers.map((marker, idx) => (
          <Marker key={idx} position={[marker.lat, marker.lng]} icon={getIcon(marker.type)}>
            {marker.label && <Popup>{marker.label}</Popup>}
          </Marker>
        ))}
        {route && route.length > 1 && (
          <Polyline positions={route} color="hsl(var(--primary))" weight={4} opacity={0.7} />
        )}
      </MapContainer>
    </div>
  );
};

export default DeliveryMap;

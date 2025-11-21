import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

export default function HazardMap() {
  const defaultPosition = [2.945747, 101.87509]; // Singapore center (change if needed)

  return (
    <MapContainer
      center={defaultPosition}
      zoom={10}
      scrollWheelZoom={true}
      zoomControl={false}
      attributionControl={false}
      className="w-full h-full"
    >
      <TileLayer url="https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png" />
    </MapContainer>
  );
}

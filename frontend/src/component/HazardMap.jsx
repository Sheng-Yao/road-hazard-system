import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { useEffect, useState, useRef } from "react";
import L from "leaflet";

const alertIcon = new L.Icon({
  iconUrl: "/markers/alert.png",
  iconSize: [64, 64],
  // iconAnchor: [32, 54],
  // popupAnchor: [0, -54],
});

function MapHighlighter({ highlightHazard, markerRefs }) {
  const map = useMap();
  // setTimeout(() => {
  //   const marker = markerRefs.current?.[highlightHazard.id];
  //   if (marker) marker.openPopup();
  // }, 800); // increased delay

  useEffect(() => {
    if (!highlightHazard) return;

    // Center map
    map.setView([highlightHazard.latitude, highlightHazard.longitude], 16, {
      animate: true,
    });

    setTimeout(() => {
      map.panBy([0, -200], { animate: true }); // ⬅ flipped sign
    }, 500);

    setTimeout(() => {
      const marker = markerRefs.current?.[highlightHazard.id];
      if (marker) marker.openPopup();
    }, 800);
  }, [highlightHazard]);

  return null;
}

export default function HazardMap({ highlightHazard }) {
  const defaultPosition = [2.945747, 101.87509]; // Singapore center (change if needed)
  const [hazards, setHazards] = useState([]);
  const markerRefs = useRef({});

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(
          "https://road-hazard-api.road-hazard-system.workers.dev/stats"
        ); // <- update URL if deployed
        const data = await res.json();
        setHazards(data);
      } catch (err) {
        console.error("Failed to fetch hazard data", err);
      }
    }

    loadData();
  }, []);

  return (
    <MapContainer
      center={defaultPosition}
      zoom={11}
      scrollWheelZoom={true}
      zoomControl={false}
      attributionControl={false}
      className="w-full h-full"
    >
      {/* 🔥 Add this so map reacts to modal click */}
      <MapHighlighter
        highlightHazard={highlightHazard}
        markerRefs={markerRefs}
      />

      <TileLayer url="https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png" />

      {hazards.map((h) => (
        <Marker
          key={h.id}
          position={[h.latitude, h.longitude]}
          icon={alertIcon}
          ref={(el) => (markerRefs.current[h.id] = el)}
        >
          <Popup maxWidth={400} className="popup-custom">
            <div className="space-y-0.5 text-sm leading-snug w-full">
              <h3 className="text-lg font-bold">{h.hazard_type}</h3>
              {/* Bold Labels + Normal Text */}
              <p>
                <span className="font-semibold">Risk:</span> {h.risk_level}
              </p>

              <p>
                <span className="font-semibold">Repair Material:</span>{" "}
                {h.repair_material}
              </p>

              <p>
                <span className="font-semibold">Volume:</span>{" "}
                {h.volume_required}
              </p>

              <p>
                <span className="font-semibold">Manpower:</span>{" "}
                {h.manpower_required}
              </p>
              {/* Image */}
              {h.image_url && (
                <img
                  src={h.image_url}
                  alt={h.hazard_type}
                  className="mt-3 max-w-[300px] h-auto rounded shadow-lg"
                />
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

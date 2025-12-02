import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import {
  useEffect,
  useState,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import MarkerClusterGroup from "react-leaflet-cluster";

import L from "leaflet";

const alertIcon = new L.Icon({
  iconUrl: "/markers/alert.png",
  iconSize: [64, 64],
  iconAnchor: [32, 64],
  popupAnchor: [0, -64],
});

function MapHighlighter({ highlightHazard, markerRefs }) {
  const map = useMap();

  useEffect(() => {
    if (!highlightHazard) return;

    const latlng = [highlightHazard.latitude, highlightHazard.longitude];

    // 1. Move the map to the marker position (zoom 16)
    map.setView(latlng, 16, { animate: true });

    // 2. Once the map finishes moving, open & align popup
    map.once("moveend", () => {
      const marker = markerRefs.current?.[highlightHazard.id];
      if (!marker) return;

      const popup = marker.getPopup();
      if (!popup) return;

      // Disable Leaflet auto-pan fully (clustered markers ignore the JSX prop)
      popup.options.autoPan = false;

      marker.openPopup();

      // Allow DOM to render popup content
      setTimeout(() => {
        popup.update();

        // Pan DOWN by 320px (popup goes UP)
        map.panBy([0, -320], { animate: true });
      }, 50);
    });
  }, [highlightHazard]);

  return null;
}

const HazardMap = forwardRef(function HazardMap({ onShowDetailsFromMap }, ref) {
  const defaultPosition = [2.945747, 101.87509]; // Singapore center (change if needed)
  const [hazards, setHazards] = useState([]);
  const markerRefs = useRef({});
  const [localHighlight, setLocalHighlight] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [popupProgress, setPopupProgress] = useState({});

  // Allow parent (App.jsx) to trigger highlight
  useImperativeHandle(ref, () => ({
    highlight: (hazard) => {
      setLocalHighlight(hazard);
    },
  }));

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(
          "https://road-hazard-api.road-hazard-system.workers.dev/hazard-map"
        ); // <- update URL if deployed
        const data = await res.json();
        setHazards(data);
      } catch (err) {
        console.error("Failed to fetch hazard data", err);
      }
    }

    loadData();
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      console.warn("Geolocation is not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation([pos.coords.latitude, pos.coords.longitude]);
      },
      (err) => {
        console.warn("User location blocked or unavailable:", err);
      }
    );
  }, []);

  async function loadProgress(id) {
    if (popupProgress[id]) return; // Cached, no need to refetch

    try {
      const res = await fetch(
        `https://road-hazard-api.road-hazard-system.workers.dev/repair/${id}`
      );
      const data = await res.json();

      setPopupProgress((prev) => ({
        ...prev,
        [id]: data || {},
      }));
    } catch (err) {
      console.error("Failed to load progress", err);
    }
  }

  function getProgressStatus(p) {
    if (!p || Object.keys(p).length === 0) return "none";
    if (p.completed_at) return "completed";
    if (p.in_progress_at) return "in_progress";
    if (p.team_assigned_at) return "assigned";
    return "reported";
  }

  function getProgressText(p) {
    if (!p || Object.keys(p).length === 0) return "No Progress";
    if (p.completed_at) return "Completed";
    if (p.in_progress_at) return "In Progress";
    if (p.team_assigned_at) return "Team Assigned";
    return "Reported";
  }

  function getProgressColor(status) {
    return status === "completed"
      ? "text-green-600"
      : status === "in_progress"
      ? "text-blue-600"
      : status === "assigned"
      ? "text-amber-600"
      : "text-gray-500";
  }

  return (
    <MapContainer
      center={userLocation || defaultPosition}
      zoom={12}
      scrollWheelZoom={true}
      zoomControl={false}
      attributionControl={false}
      className="w-full h-full"
    >
      {/* 🔥 Add this so map reacts to modal click */}
      <MapHighlighter
        highlightHazard={localHighlight}
        markerRefs={markerRefs}
      />

      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      <MarkerClusterGroup disableClusteringAtZoom={10}>
        {hazards.map((h) => (
          <Marker
            key={h.id}
            position={[h.latitude, h.longitude]}
            icon={alertIcon}
            ref={(marker) => {
              if (marker && !markerRefs.current[h.id]) {
                markerRefs.current[h.id] = marker;
              }
            }}
            eventHandlers={{
              click: () => setLocalHighlight(h),
            }}
          >
            <Popup
              maxWidth={250}
              className="popup-custom"
              autoPan={false}
              keepInView={true}
              eventHandlers={{
                add: () => loadProgress(h.id), // Load when popup opens
              }}
            >
              <div className="text-sm leading-snug w-full space-y-0.5">
                <h3 className="text-lg font-bold">{h.hazard_type}</h3>
                {/* Bold Labels + Normal Text */}
                <p>
                  <span className="font-semibold">Risk:</span> {h.risk_level}
                  <br />
                  <span className="font-semibold">Repair Material:</span>{" "}
                  {h.repair_material}
                  <br />
                  <span className="font-semibold">Volume:</span>{" "}
                  {h.volume_material_required}
                  <br />
                  <span className="font-semibold">Manpower:</span>{" "}
                  {h.manpower_required}
                  <br />
                  <span className="font-semibold">Progress:</span>{" "}
                  <span
                    className={`mt-0 text-sm font-semibold ${getProgressColor(
                      getProgressStatus(popupProgress[h.id])
                    )}`}
                  >
                    {popupProgress[h.id]
                      ? getProgressText(popupProgress[h.id])
                      : "Loading progress..."}
                  </span>
                </p>

                {/* Image */}
                {h.image_url && (
                  <img
                    loading="lazy"
                    src={h.image_url}
                    alt={h.hazard_type}
                    className="mt-1 max-w-[250px] h-auto rounded shadow-lg"
                    onLoad={() => {
                      const marker = markerRefs.current?.[h.id];
                      if (!marker) return;

                      // Ask Leaflet to update popup size
                      const popup = marker.getPopup();
                      popup?.update();

                      // Trigger map movement by firing the same event
                      // marker._map?.fire("moveend");
                    }}
                  />
                )}

                <button
                  className="w-full mt-3 px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded text-center cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onShowDetailsFromMap(h); // ↩ Call function from App.jsx
                  }}
                >
                  View Full Details →
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  );
});

export default HazardMap;

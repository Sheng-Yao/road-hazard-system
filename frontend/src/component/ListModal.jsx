import React, { useEffect, useState, useMemo } from "react";

export default function ListModal({
  onClose,
  onHighlight,
  initialHazardId,
  onShowRepairModal,
  forceDetails,
  refreshId,
}) {
  const [hazards, setHazards] = useState([]);
  const [selectedHazard, setSelectedHazard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isMobile = window.innerWidth < 768;
  const [mobilePage, setMobilePage] = useState("list");

  const API_BASE = "https://road-hazard-api.road-hazard-system.workers.dev";

  // NEW: store progress per hazard
  const [progressData, setProgressData] = useState({});

  const jobList = useMemo(() => {
    if (!selectedHazard) return [];
    try {
      return JSON.parse(selectedHazard.job_distribution || "[]");
    } catch {
      return [];
    }
  }, [selectedHazard]);

  const riskReasonList = useMemo(() => {
    if (!selectedHazard) return [];
    try {
      return JSON.parse(selectedHazard.risk_reason || "[]");
    } catch {
      return [];
    }
  }, [selectedHazard]);

  const materialReasonList = useMemo(() => {
    if (!selectedHazard) return [];
    try {
      return JSON.parse(selectedHazard.repair_material_reason || "[]");
    } catch {
      return [];
    }
  }, [selectedHazard]);

  const guideList = useMemo(() => {
    if (!selectedHazard) return [];
    try {
      return JSON.parse(selectedHazard.repair_guide || "[]");
    } catch {
      return [];
    }
  }, [selectedHazard]);

  useEffect(() => {
    async function fetchHazards() {
      try {
        const res = await fetch(`${API_BASE}/stats`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        setHazards(data);
      } catch (err) {
        setError("Failed to fetch hazard data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchHazards();
  }, []);

  // Load progress for all hazards one-by-one (non-blocking)
  useEffect(() => {
    if (hazards.length === 0) return;

    let index = 0;

    function loadNext() {
      if (index >= hazards.length) return;

      const id = hazards[index].id;

      // skip if already loaded
      if (!progressData[id]) {
        fetch(`${API_BASE}/repair/${id}`)
          .then((res) => res.json())
          .then((data) => {
            setProgressData((prev) => ({
              ...prev,
              [id]: data || {},
            }));
          })
          .catch((err) => console.error("Progress load failed:", err));
      }

      index++;

      // Slight delay = smoother UI + prevents API spike
      setTimeout(loadNext, 120);
    }

    loadNext();
  }, [hazards]);

  /* -----------------------------------------------
      NEW: Helper to display last progress text
  -------------------------------------------------- */
  function getLatestProgressText(t) {
    if (!t || Object.keys(t).length === 0) return "No Progress";

    if (t.completed_at)
      return "Completed: " + new Date(t.completed_at).toLocaleString();
    if (t.in_progress_at)
      return "In Progress: " + new Date(t.in_progress_at).toLocaleString();
    if (t.team_assigned_at)
      return "Team Assigned: " + new Date(t.team_assigned_at).toLocaleString();

    return "Reported";
  }

  async function loadHazardDetails(id) {
    try {
      const res = await fetch(`${API_BASE}/hazard/${id}`);

      const data = await res.json();
      setSelectedHazard(data);
    } catch (err) {
      console.error("Failed to load hazard details:", err);
    }
  }

  useEffect(() => {
    // Only run after hazards list is loaded
    if (!loading && initialHazardId) {
      loadHazardDetails(initialHazardId);

      // On mobile, jump straight to the details screen
      if (isMobile) {
        setMobilePage("details");
      }
    }
  }, [loading, initialHazardId]);

  function resetState() {
    setSelectedHazard(null);
    setMobilePage("list");
  }

  useEffect(() => {
    if (isMobile && forceDetails) {
      setMobilePage("details");
    }
  }, [forceDetails]);

  const handleClick = (id) => {
    loadHazardDetails(id);
    if (isMobile) setMobilePage("details");
  };

  useEffect(() => {
    if (!refreshId) return;

    // refetch only the updated hazard progress
    fetch(`${API_BASE}/repair/${refreshId}`)
      .then((res) => res.json())
      .then((data) => {
        setProgressData((prev) => ({
          ...prev,
          [refreshId]: data || {},
        }));
      })
      .catch(console.error);
  }, [refreshId]);

  const HazardItem = React.memo(function HazardItem({
    item,
    selected,
    progress,
  }) {
    return (
      <div
        onClick={() => {
          loadHazardDetails(item.id);
          if (isMobile) setMobilePage("details");
        }}
        className={`flex items-center justify-between border p-4 rounded shadow-sm mb-3 cursor-pointer ${
          selected
            ? "bg-blue-100 border-blue-400"
            : "bg-white hover:bg-gray-100"
        }`}
      >
        <div>
          <p className="font-bold capitalize">{item.hazard_type}</p>
          <p className="text-sm text-gray-600">State: {item.state}</p>
          <p className="text-sm">Risk Level: {item.risk_level}</p>

          <p className="text-[10px] text-gray-400">
            {new Date(item.reported_at).toLocaleString()}
          </p>

          <p className="text-[11px] text-blue-600 font-semibold mt-1">
            {getLatestProgressText(progress)}
          </p>
        </div>

        {item.image_url && (
          <img
            loading="lazy"
            src={item.image_url}
            className="h-24 w-24 object-cover rounded"
          />
        )}
      </div>
    );
  });

  return (
    <>
      {/* Darkened background */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"></div>

      {/* Modal Container */}
      <div
        className={`fixed ${
          isMobile
            ? "top-0 w-full h-full left-0"
            : "top-20 left-1/2 -translate-x-1/2 w-[90%] max-w-[1200px] h-[85%]"
        } bg-white text-black rounded-lg shadow-lg z-50 flex flex-col`}
      >
        {/* Header Row */}
        <div className="flex justify-between items-center border-b px-6 py-3">
          <h2 className="text-2xl font-bold">Hazard List</h2>

          <button
            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 cursor-pointer"
            onClick={() => {
              resetState();
              onClose();
            }}
          >
            Close
          </button>
        </div>

        {/* Display API results */}
        <div className="flex flex-1 overflow-hidden px-6 py-4">
          {/* LEFT — LIST PAGE */}
          {(!isMobile || mobilePage === "list") && (
            <div
              className={`${
                isMobile ? "w-full" : "w-1/3"
              } overflow-y-auto border-r pr-4 h-full`}
            >
              {loading && (
                <p className="text-gray-500 text-center mt-10">
                  Loading hazards...
                </p>
              )}

              {error && (
                <p className="text-red-500 text-center mt-10">{error}</p>
              )}

              {!loading && !error && hazards.length === 0 && (
                <p className="text-gray-500 text-center mt-10">
                  No hazards found.
                </p>
              )}

              {hazards.map((item) => (
                <HazardItem
                  key={item.id}
                  item={item}
                  selected={selectedHazard?.id === item.id}
                  progress={progressData[item.id]}
                />
              ))}
            </div>
          )}

          {/* RIGHT — DETAILS PAGE */}
          {selectedHazard && (!isMobile || mobilePage === "details") && (
            <div
              className={`${isMobile ? "w-full mobile-hide-scroll" : "w-2/3"} 
               pl-4 md:pr-10 lg:pr-16 overflow-y-auto h-full justify-center`}
            >
              <div className="max-w-[600px] w-full space-y-4 mx-auto">
                <h3 className="text-2xl font-bold">
                  {selectedHazard.hazard_type}
                </h3>

                <img
                  loading="lazy"
                  src={selectedHazard.image_url}
                  className="w-full max-h-64 object-cover rounded mb-4"
                  alt="hazard"
                />

                <p>
                  <strong>Risk Level:</strong> {selectedHazard.risk_level}
                </p>
                <p className="font-semibold">Risk Reason:</p>
                <ul className="list-disc ml-5 text-sm mt-2">
                  {riskReasonList.map((reason, i) => (
                    <li key={i}>{reason}</li>
                  ))}
                </ul>

                <p>
                  <strong>Location:</strong>{" "}
                  {selectedHazard.latitude.toFixed(5)},{" "}
                  {selectedHazard.longitude.toFixed(5)}
                </p>

                <hr className="my-4" />

                <h4 className="text-xl font-semibold">Repair Information</h4>

                <p>
                  <strong>Material:</strong> {selectedHazard.repair_material}
                </p>

                <p className="font-semibold">Material Reason:</p>
                <ul className="list-disc ml-5 text-sm mt-2">
                  {materialReasonList.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>

                <p>
                  <strong>Required Volume:</strong>{" "}
                  {selectedHazard.volume_material_required}
                </p>
                <p>
                  <strong>Calculation:</strong>{" "}
                  {selectedHazard.volume_calculation}
                </p>

                <p>
                  <strong>Manpower:</strong> {selectedHazard.manpower_required}
                </p>

                <p className="font-semibold">Task Breakdown:</p>
                <ul className="list-disc ml-5 text-sm mt-2">
                  {jobList.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>

                <div className="mt-4 p-3 bg-gray-100 rounded">
                  <p className="font-semibold">Repair Guide:</p>
                  <ul className="list-decimal ml-5 text-sm mt-2">
                    {guideList.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ul>
                </div>

                <div className="flex gap-3 mt-4">
                  {isMobile && (
                    <button
                      onClick={() => {
                        setMobilePage("list");
                        setSelectedHazard(null);
                      }}
                      className="px-3 py-2 bg-gray-200 rounded cursor-pointer"
                    >
                      ← Back to List
                    </button>
                  )}

                  <button
                    onClick={() => {
                      resetState();
                      onClose();
                      onHighlight(selectedHazard);
                    }}
                    className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 cursor-pointer"
                  >
                    Highlight on Map
                  </button>

                  <button
                    onClick={() =>
                      onShowRepairModal && onShowRepairModal(selectedHazard)
                    }
                    className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 cursor-pointer"
                  >
                    Track Repair Progress
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

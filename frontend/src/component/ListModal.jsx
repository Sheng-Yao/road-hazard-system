import { useEffect, useState } from "react";

export default function ListModal({ onClose, onHighlight }) {
  const [hazards, setHazards] = useState([]);
  const [selectedHazard, setSelectedHazard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // if (!selectedHazard) return null; // prevents crash

  const jobList = selectedHazard?.job_distribution
    ? JSON.parse(selectedHazard.job_distribution)
    : [];

  const guideList = selectedHazard?.repair_guide
    ? JSON.parse(selectedHazard.repair_guide)
    : [];

  const riskReasonList = selectedHazard?.risk_reason
    ? JSON.parse(selectedHazard.risk_reason)
    : [];

  const materialReasonList = selectedHazard?.repair_material_reason
    ? JSON.parse(selectedHazard.repair_material_reason)
    : [];

  useEffect(() => {
    async function fetchHazards() {
      try {
        const res = await fetch(
          "https://road-hazard-api.road-hazard-system.workers.dev/stats"
        );
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

  async function loadHazardDetails(id) {
    try {
      const res = await fetch(
        `https://road-hazard-api.road-hazard-system.workers.dev/hazard/${id}`
      );

      const data = await res.json();
      setSelectedHazard(data);
    } catch (err) {
      console.error("Failed to load hazard details:", err);
    }
  }

  return (
    <>
      {/* Darkened background */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"></div>

      {/* Modal Container */}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 w-[90%] max-w-[1200px] h-[85%] bg-white text-black rounded-lg shadow-lg z-50 flex flex-col">
        {/* Header Row */}
        <div className="flex justify-between items-center border-b px-6 py-3">
          <h2 className="text-2xl font-bold">Hazard List</h2>

          <button
            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 cursor-pointer"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        {/* Display API results */}
        <div className="flex flex-1 overflow-hidden px-6 py-4">
          {/* LEFT — LIST */}
          <div className="w-1/3 overflow-y-auto border-r pr-4 h-full">
            {loading && (
              <p className="text-gray-500 text-center mt-10">
                Loading hazards...
              </p>
            )}

            {error && <p className="text-red-500 text-center mt-10">{error}</p>}

            {!loading && !error && hazards.length === 0 && (
              <p className="text-gray-500 text-center mt-10">
                No hazards found.
              </p>
            )}

            {hazards.map((item) => (
              <div
                key={item.id}
                onClick={() => loadHazardDetails(item.id)}
                className="flex items-center justify-between border p-4 rounded shadow-sm mb-3 cursor-pointer hover:bg-gray-100"
              >
                {/* Left: Text */}
                <div>
                  <p className="font-bold capitalize">{item.hazard_type}</p>

                  <p className="text-sm text-gray-600">State: {item.state}</p>

                  <p className="text-sm">Risk Level: {item.risk_level}</p>

                  <p className="text-[10px] text-gray-400">
                    {new Date(item.reported_at).toLocaleString()}
                  </p>
                </div>

                {/* Right: Thumbnail */}
                {item.image_url && (
                  <img
                    src={item.image_url}
                    className="h-24 w-24 object-cover rounded"
                    alt="preview"
                  />
                )}
              </div>
            ))}
          </div>
          {/* RIGHT — DETAILS */}
          <div className="w-2/3 pl-4 overflow-y-auto h-full">
            {selectedHazard && (
              <div className="space-y-4">
                <h3 className="text-2xl font-bold">
                  {selectedHazard.hazard_type}
                </h3>

                <img
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

                <button
                  onClick={() => {
                    onClose();
                    onHighlight(selectedHazard);
                  }}
                  className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 cursor-pointer"
                >
                  Highlight on Map
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

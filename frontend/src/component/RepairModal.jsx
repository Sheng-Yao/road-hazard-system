import { useState, useEffect } from "react";

export default function RepairModal({ hazard, onClose }) {
  const [workers, setWorkers] = useState([]);
  const [assignedTo, setAssignedTo] = useState("");
  const [status, setStatus] = useState("reported");
  const [upload, setUpload] = useState(null);
  const [progress, setProgress] = useState(null);

  const API_BASE = "https://road-hazard-api.road-hazard-system.workers.dev";

  useEffect(() => {
    if (!hazard) return;

    async function loadTracker() {
      const res = await fetch(`${API_BASE}/repair/${hazard.id}`);
      const data = await res.json();

      setProgress(data);
      setAssignedTo(data.worker_id || "");
      setStatus(getCurrentStatus(data));
    }

    loadTracker();
  }, [hazard]);

  function getCurrentStatus(p) {
    if (p.completed_at) return "completed";
    if (p.in_progress_at) return "in_progress";
    if (p.team_assigned_at) return "assigned";
    return "reported";
  }

  /* -------------------------------------------------------
     FETCH WORKERS FROM DB
  ------------------------------------------------------- */
  useEffect(() => {
    async function loadWorkers() {
      const res = await fetch(`${API_BASE}/workers`);
      const data = await res.json();
      setWorkers(data);
    }
    loadWorkers();
  }, []);

  function handleFileChange(e) {
    setUpload(e.target.files[0]);
  }

  function isBackwardUpdate(newStatus, progress) {
    if (!progress) return false;

    const order = ["reported", "assigned", "in_progress", "completed"];

    const currentIdx = order.indexOf(getCurrentStatus(progress));
    const newIdx = order.indexOf(newStatus);

    // Block backward or same-level updates
    return newIdx <= currentIdx;
  }

  function isBackwardOption(option, progress) {
    if (!progress) return false;

    const order = ["reported", "assigned", "in_progress", "completed"];
    const currentIdx = order.indexOf(getCurrentStatus(progress));
    const optionIdx = order.indexOf(option);

    return optionIdx <= currentIdx; // backward OR same = disable
  }

  /* -------------------------------------------------------
     SAVE REPAIR UPDATE
  ------------------------------------------------------- */
  async function handleSubmit() {
    if (!status) {
      alert("Please select a repair status.");
      return;
    }

    // PREVENT BACKWARD MOVEMENT
    if (isBackwardUpdate(status, progress)) {
      alert("You cannot go backward or repeat the same status.");
      return;
    }

    const payload = {
      status,
      worker: assignedTo || null, // FIXED: backend expects "worker"
      photo_url: null,
    };

    const res = await fetch(`${API_BASE}/update-repair/${hazard.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await res.json();

    if (!res.ok) {
      alert(result.error || "Failed to update progress.");
      return;
    }

    alert("Repair progress updated!");
    setUpload(null);
    onClose();
  }

  return (
    <>
      {/* DARK BACKDROP */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"></div>

      {/* MODAL */}
      <div
        className="
          fixed top-16 left-1/2 -translate-x-1/2 
          w-[90%] max-w-[600px] bg-white text-black
          rounded-lg shadow-xl p-6 z-50 overflow-y-auto no-scrollbar max-h-[90vh]
      "
      >
        <h2 className="text-2xl font-bold mb-4">
          Repair Tracking — {hazard.hazard_type}
        </h2>

        {/* PROGRESS TIMELINE */}
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Progress Timeline</h3>

          <ul className="border-l-2 border-gray-400 pl-4 space-y-3 text-sm">
            <li className="text-green-700">
              🟢 Reported: {progress?.reported_at || "—"}
            </li>

            <li
              className={
                progress?.team_assigned_at ? "text-green-700" : "text-gray-500"
              }
            >
              {progress?.team_assigned_at ? "🟢" : "⚪"} Team Assigned:{" "}
              {progress?.team_assigned_at || "—"}
            </li>

            <li
              className={
                progress?.in_progress_at ? "text-green-700" : "text-gray-500"
              }
            >
              {progress?.in_progress_at ? "🟢" : "⚪"} In Progress:{" "}
              {progress?.in_progress_at || "—"}
            </li>

            <li
              className={
                progress?.completed_at ? "text-green-700" : "text-gray-500"
              }
            >
              {progress?.completed_at ? "🟢" : "⚪"} Completed:{" "}
              {progress?.completed_at || "—"}
            </li>
          </ul>
        </div>

        {/* ASSIGN WORKER */}
        <label className="font-semibold">Assign to:</label>
        <select
          value={assignedTo}
          onChange={(e) => setAssignedTo(e.target.value)}
          className="w-full border p-2 rounded mb-4"
        >
          <option value="">Select Personnel</option>
          {workers.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>

        {/* STATUS DROPDOWN */}
        <label className="font-semibold">Update Status:</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full border p-2 rounded mb-4"
        >
          {["reported", "assigned", "in_progress", "completed"].map((opt) => (
            <option
              key={opt}
              value={opt}
              disabled={isBackwardOption(opt, progress)} // <— here!
              className={
                isBackwardOption(opt, progress)
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-black"
              }
            >
              {opt === "reported"
                ? "Reported"
                : opt === "assigned"
                ? "Team Assigned"
                : opt === "in_progress"
                ? "In Progress"
                : "Completed"}
            </option>
          ))}
        </select>

        {/* FILE UPLOAD */}
        <div className="mb-4">
          <label className="block mb-1 font-semibold">
            Upload Repair Photo:
          </label>

          <input
            type="file"
            onChange={handleFileChange}
            className="block w-full text-sm
               file:mr-4 file:py-2 file:px-4
               file:rounded file:border-0
               file:text-sm file:font-semibold
               file:bg-blue-50 file:text-blue-700
               hover:file:bg-blue-100 cursor-pointer"
          />
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex justify-between mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 cursor-pointer"
          >
            Close
          </button>

          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 cursor-pointer"
          >
            Save Progress
          </button>
        </div>
      </div>
    </>
  );
}

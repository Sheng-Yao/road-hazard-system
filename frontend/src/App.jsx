import { useState, useEffect, useRef } from "react";
import roadImg from "./assets/road.png";

import HazardMap from "./component/HazardMap.jsx";
import ListModal from "./component/ListModal.jsx";
import RepairModal from "./component/RepairModal.jsx";

const isMobile = window.innerWidth < 768;

export default function App() {
  const [activeTab, setActiveTab] = useState("map");
  const [showList, setShowList] = useState(false);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [showRepairModal, setShowRepairModal] = useState(false);
  const [repairHazard, setRepairHazard] = useState(null);

  const [initialHazardId, setInitialHazardId] = useState(null);

  const [forceDetails, setForceDetails] = useState(false);
  const mapRef = useRef(null);

  const [refreshId, setRefreshId] = useState(null);

  function showHazardDetailsFromMap(hazard) {
    mapRef.current?.highlight(hazard);
    setInitialHazardId(hazard.id);
    setForceDetails(true);
    setShowList(true);
    setActiveTab("list");
  }

  function handleShowRepairModal(hazard) {
    setRepairHazard(hazard);
    setShowRepairModal(true);
  }

  return (
    <div className="h-screen w-screen overflow-hidden relative">
      {/* ✅ MOBILE HEADER (only shows on mobile) */}
      {/* MOBILE HEADER — hide when list is open */}
      {!showList && (
        <header
          className="flex md:hidden items-center justify-between p-2 
               bg-black/70 text-white fixed top-0 left-0 w-full z-50 shadow-md h-12"
        >
          <h1 className="text-md font-bold">Road Hazard System</h1>

          <button
            className="text-white text-xl cursor-pointer"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            ☰
          </button>
        </header>
      )}

      {/* ✅ MOBILE DROPDOWN MENU */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed top-12 left-0 w-full bg-black/80 text-white p-4 space-y-3 z-50">
          <ul className="flex flex-col gap-1 w-full">
            <li>
              <button
                disabled={showList}
                onClick={() => {
                  setActiveTab("map");
                  setShowList(false);
                }}
                className={`w-full text-center px-3 py-1 rounded cursor-pointer transition 
            ${
              activeTab === "map"
                ? "bg-white text-black font-semibold"
                : "hover:bg-white hover:text-black"
            }`}
              >
                Map
              </button>
            </li>

            <li>
              <button
                onClick={() => {
                  setActiveTab("list");
                  setShowList(true);
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-center px-3 py-1 rounded cursor-pointer transition 
            ${
              activeTab === "list"
                ? "bg-white text-black font-semibold"
                : "hover:bg-white hover:text-black"
            }`}
              >
                List
              </button>
            </li>
          </ul>
        </div>
      )}

      {/* ✅ DESKTOP HEADER (only shows on desktop) */}
      <header
        className="hidden md:flex items-center justify-between p-4 
                      bg-black/70 text-white fixed top-0 left-0 w-full z-50 shadow-md"
      >
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">Road Hazard System</h1>
          <img src={roadImg} alt="Logo" className="h-10 w-auto" />
        </div>

        <ul className="flex gap-6">
          <li>
            <button
              disabled={showList}
              onClick={() => {
                setActiveTab("map");
                setShowList(false);
              }}
              className={`px-4 py-2 rounded cursor-pointer transition ${
                activeTab === "map"
                  ? "bg-white text-black font-semibold"
                  : "hover:bg-white hover:text-black"
              }`}
            >
              Map
            </button>
          </li>

          <li>
            <button
              onClick={() => {
                setActiveTab("list");
                setShowList(true);
              }}
              className={`px-4 py-2 rounded transition ${
                activeTab === "list"
                  ? "bg-white text-black font-semibold"
                  : "hover:bg-white hover:text-black"
              } ${
                showList ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
              }`}
            >
              List
            </button>
          </li>
        </ul>
      </header>
      <main className="absolute inset-0 z-0">
        <HazardMap
          ref={mapRef}
          onShowDetailsFromMap={showHazardDetailsFromMap}
        />
      </main>
      {activeTab === "list" && showList && (
        <div className="relative z-20">
          {/* 🌑 Full dark overlay above map & list — only when RepairModal is visible */}
          {showRepairModal && (
            <div className="fixed inset-0 bg-black/60 z-30"></div>
          )}

          {/* List Modal (dimmed slightly when RepairModal opens) */}
          <div
            className={`relative z-40 transition ${
              showRepairModal ? "opacity-30" : "opacity-100"
            }`}
          >
            <ListModal
              initialHazardId={initialHazardId}
              forceDetails={forceDetails}
              onClose={() => {
                setShowList(false);
                setActiveTab("map");
                setInitialHazardId(null);
                setForceDetails(false);
                setMobileMenuOpen(false);
              }}
              onHighlight={(hazard) => {
                mapRef.current?.highlight(hazard);
                setShowList(false);
              }}
              onShowRepairModal={handleShowRepairModal}
              refreshId={refreshId}
            />
          </div>
        </div>
      )}
      {showRepairModal && (
        <RepairModal
          hazard={repairHazard}
          onClose={() => setShowRepairModal(false)}
          onUpdated={(id) => setRefreshId(id)}
        />
      )}
    </div>
  );
}

import { useState } from "react";
import roadImg from "./assets/road.png";

import HazardMap from "./component/HazardMap.jsx";
import ListModal from "./component/ListModal.jsx";

const isMobile = window.innerWidth < 768;

export default function App() {
  const [activeTab, setActiveTab] = useState("map");
  const [showList, setShowList] = useState(false);
  const [focusHazard, setFocusHazard] = useState(null);
  const [highlightHazard, setHighlightHazard] = useState(null);

  const [mobileView, setMobileView] = useState(isMobile);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="h-screen w-screen overflow-hidden relative">
      {/* ✅ MOBILE HEADER (only shows on mobile) */}
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
          highlightHazard={highlightHazard}
          onHighlight={setHighlightHazard}
        />
      </main>
      {activeTab === "list" && showList && (
        <ListModal
          onClose={() => {
            setShowList(false);
            setActiveTab("map");
          }}
          onHighlight={(hazard) => {
            setHighlightHazard(hazard);
            setShowList(false); // close modal here
          }}
        />
      )}
    </div>
  );
}

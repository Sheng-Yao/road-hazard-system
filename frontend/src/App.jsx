import { useState } from "react";
import roadImg from "./assets/road.png";

import HazardMap from "./component/HazardMap.jsx";
import ListModal from "./component/ListModal.jsx";

export default function App() {
  const [activeTab, setActiveTab] = useState("map");
  const [showList, setShowList] = useState(false);
  const [focusHazard, setFocusHazard] = useState(null);

  return (
    <div className="h-screen w-screen overflow-hidden relative">
      <header className="flex items-center justify-between p-4 bg-black/70 text-white fixed top-0 left-0 w-full z-50 shadow-md">
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
              className={`px-4 py-2 rounded cursor-pointer transition
              ${
                activeTab === "map"
                  ? "bg-white text-black font-semibold"
                  : "hover:bg-white hover:text-black"
              }
            `}
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
              className={`px-4 py-2 rounded transition 
                ${
                  activeTab === "list"
                    ? "bg-white text-black font-semibold"
                    : "hover:bg-white hover:text-black"
                } 
                ${showList ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
              `}
            >
              List
            </button>
          </li>
        </ul>
      </header>
      <main className="absolute inset-0 z-0">
        <HazardMap />
      </main>
      {activeTab === "list" && showList && (
        <ListModal
          onClose={() => {
            setShowList(false);
            setActiveTab("map");
          }}
        />
      )}
    </div>
  );
}

import { Link, useLocation } from "wouter";

type GameModeTabsProps = {
  activeTab: "ai" | "multiplayer" | "tutorial";
};

const GameModeTabs = ({ activeTab }: GameModeTabsProps) => {
  return (
    <div className="mb-6">
      <div className="flex border-b border-gray-300">
        <Link href="/play" className={`px-4 py-2 border-b-2 ${
            activeTab === "ai" 
              ? "border-accent text-accent font-medium" 
              : "border-transparent hover:text-primary"
          }`}>
            Play vs Computer
        </Link>
        <Link href="/multiplayer" className={`px-4 py-2 border-b-2 ${
            activeTab === "multiplayer" 
              ? "border-accent text-accent font-medium" 
              : "border-transparent hover:text-primary"
          }`}>
            Play Online
        </Link>
        <Link href="/tutorial" className={`px-4 py-2 border-b-2 ${
            activeTab === "tutorial" 
              ? "border-accent text-accent font-medium" 
              : "border-transparent hover:text-primary"
          }`}>
            Chess Tutorial
        </Link>
      </div>
    </div>
  );
};

export default GameModeTabs;

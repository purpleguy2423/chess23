import { Link, useLocation } from "wouter";

type GameModeTabsProps = {
  activeTab: "ai" | "multiplayer" | "tutorial";
};

const GameModeTabs = ({ activeTab }: GameModeTabsProps) => {
  return (
    <div className="mb-6">
      <div className="flex border-b border-gray-300">
        <Link href="/play">
          <a className={`px-4 py-2 border-b-2 ${
            activeTab === "ai" 
              ? "border-accent text-accent font-medium" 
              : "border-transparent hover:text-primary"
          }`}>
            Play vs Computer
          </a>
        </Link>
        <Link href="/multiplayer">
          <a className={`px-4 py-2 border-b-2 ${
            activeTab === "multiplayer" 
              ? "border-accent text-accent font-medium" 
              : "border-transparent hover:text-primary"
          }`}>
            Play Online
          </a>
        </Link>
        <Link href="/tutorial">
          <a className={`px-4 py-2 border-b-2 ${
            activeTab === "tutorial" 
              ? "border-accent text-accent font-medium" 
              : "border-transparent hover:text-primary"
          }`}>
            Chess Tutorial
          </a>
        </Link>
      </div>
    </div>
  );
};

export default GameModeTabs;

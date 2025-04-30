import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { ChessProvider } from "./context/ChessContext";

createRoot(document.getElementById("root")!).render(
  <ChessProvider>
    <App />
  </ChessProvider>
);

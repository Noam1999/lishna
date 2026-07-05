import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { installGlobalHaptics } from "./lib/haptics";

installGlobalHaptics();

createRoot(document.getElementById("root")!).render(<App />);

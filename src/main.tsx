import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { setupGlobalErrorHandlers } from "@/utils/errorLogger";
import { setupNetworkMonitoring } from "@/lib/queryClient";

// Setup global error handlers for remote monitoring
setupGlobalErrorHandlers();
setupNetworkMonitoring();

createRoot(document.getElementById("root")!).render(<App />);

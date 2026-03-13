import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";
import { AuthProvider } from "./context/AuthContext.tsx";
import { Toaster } from "sonner";
import { registerServiceWorker, initInstallPrompt } from "./pwa";

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <App />
    <Toaster position="top-right" richColors closeButton />
  </AuthProvider>
);

// ── Initialize PWA features ──
registerServiceWorker();
initInstallPrompt();

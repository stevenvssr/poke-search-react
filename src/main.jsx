import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./style.scss"; // Assuming this is your stylesheet

// The QueryClientProvider is now ONLY managed inside App.jsx

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* We removed QueryClientProvider wrapper here */}
    <App />
  </React.StrictMode>
);

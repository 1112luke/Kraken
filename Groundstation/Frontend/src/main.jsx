import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { APIProvider } from "@vis.gl/react-google-maps";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <APIProvider apiKey={"AIzaSyAPlCn3s3ZjpUwKW6fqoKm5lXxpG3eHBCw"}>
            <App />
        </APIProvider>
    </StrictMode>
);

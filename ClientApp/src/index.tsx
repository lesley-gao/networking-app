import "./index.css";
import "./i18n";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";

const baseUrl =
  document.getElementsByTagName("base")[0]?.getAttribute("href") || "/";
const rootElement = document.getElementById("root");

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <BrowserRouter basename={baseUrl}>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  );
}

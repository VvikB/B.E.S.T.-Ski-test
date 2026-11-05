import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "@fontsource-variable/manrope";
import "./style.css";
import App from "./App";
import { PreviewProvider } from "./components/BalancePreview";
import "./alpine.css";
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <PreviewProvider>
        <App />
      </PreviewProvider>
    </BrowserRouter>
  </React.StrictMode>,
);

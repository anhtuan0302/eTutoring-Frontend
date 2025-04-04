import React from "react";
import ReactDOM from "react-dom/client";
import "./styles/index.css";
import App from "./App";
import { ConfigProvider, App as AntdApp } from "antd";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <AntdApp>
      <ConfigProvider theme={{ hashed: false }}>
        <App />
      </ConfigProvider>
    </AntdApp>
  </React.StrictMode>
);

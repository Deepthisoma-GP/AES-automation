import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { StoreProvider } from "./store.jsx";
import Layout from "./components/Layout.jsx";

import Landing from "./pages/Landing.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Repository from "./pages/Repository.jsx";
import FrameworkDetail from "./pages/FrameworkDetail.jsx";
import Discovery from "./pages/Discovery.jsx";
import Builder from "./pages/Builder.jsx";
import DataSources from "./pages/DataSources.jsx";
import UploadCenter from "./pages/UploadCenter.jsx";
import Execution from "./pages/Execution.jsx";
import Ratings from "./pages/Ratings.jsx";
import Rankings from "./pages/Rankings.jsx";
import Insights from "./pages/Insights.jsx";
import Architecture from "./pages/Architecture.jsx";
import Administration from "./pages/Administration.jsx";

const withLayout = (el) => <Layout>{el}</Layout>;

export default function App() {
  return (
    <StoreProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={withLayout(<Dashboard />)} />
        <Route path="/repository" element={withLayout(<Repository />)} />
        <Route path="/repository/:id" element={withLayout(<FrameworkDetail />)} />
        <Route path="/discovery" element={withLayout(<Discovery />)} />
        <Route path="/builder" element={withLayout(<Builder />)} />
        <Route path="/builder/:id" element={withLayout(<Builder />)} />
        <Route path="/data-sources" element={withLayout(<DataSources />)} />
        <Route path="/upload" element={withLayout(<UploadCenter />)} />
        <Route path="/execution" element={withLayout(<Execution />)} />
        <Route path="/ratings" element={withLayout(<Ratings />)} />
        <Route path="/rankings" element={withLayout(<Rankings />)} />
        <Route path="/insights" element={withLayout(<Insights />)} />
        <Route path="/architecture" element={withLayout(<Architecture />)} />
        <Route path="/administration" element={withLayout(<Administration />)} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </StoreProvider>
  );
}

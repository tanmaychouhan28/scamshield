import React from "react";
import { Routes, Route } from "react-router-dom";
import { Navbar, Footer } from "./components/Shared.jsx";
import Landing from "./pages/Landing.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import ScanResult from "./pages/ScanResult.jsx";

export default function App() {
  return (
    <div className="min-h-screen bg-white text-text antialiased" style={{ fontFamily: "Inter, 'SF Pro Display', system-ui, sans-serif" }}>
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/scan/:id" element={<ScanResult />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
    </div>
  );
}

function NotFound() {
  return (
    <div className="max-w-xl mx-auto px-6 py-32 text-center">
      <h1 className="text-[64px] font-bold text-text">404</h1>
      <p className="text-sub mt-2">This page doesn't exist — or maybe it's the scam site we warned you about.</p>
    </div>
  );
}

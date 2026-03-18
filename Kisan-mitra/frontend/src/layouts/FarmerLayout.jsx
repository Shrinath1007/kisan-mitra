import React, { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { FaBars, FaTimes } from "react-icons/fa";
import Sidebar from "../components/Farmer/Sidebar";
import "./FarmerLayout.css";

const getTitleFromPathname = (pathname) => {
  const segment = pathname.split("/").pop();
  if (!segment || segment === "farmer") return "Dashboard";
  const title = segment.replace(/-/g, " ");
  return title.charAt(0).toUpperCase() + title.slice(1);
};

const FarmerLayout = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const title = getTitleFromPathname(location.pathname);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="layout-container">
      <Sidebar isOpen={isSidebarOpen} closeSidebar={toggleSidebar} />

      <div className={`content-area ${isSidebarOpen ? "sidebar-open" : ""}`}>
        <header className="content-header">
          <button className="menu-toggle" onClick={toggleSidebar}>
            {isSidebarOpen ? <FaTimes /> : <FaBars />}
          </button>
          <h1>{title}</h1>
        </header>
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};


export default FarmerLayout;

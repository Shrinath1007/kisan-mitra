import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { FaBars, FaTimes } from 'react-icons/fa';

import Sidebar from '../components/MachineOwner/Sidebar';


const getTitleFromPathname = (pathname) => {
  const segment = pathname.split('/').pop();
  if (!segment) return 'Dashboard';
  const title = segment.replace(/-/g, ' ');
  return title.charAt(0).toUpperCase() + title.slice(1);
};

const MachineOwnerLayout = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const title = getTitleFromPathname(location.pathname);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="dashboard-container">
      <Sidebar isOpen={isSidebarOpen} closeSidebar={toggleSidebar} />

      <div className={`dashboard-content ${isSidebarOpen ? 'sidebar-open' : ''}`}>
        <header className="dashboard-header">
          <button className="menu-toggle" onClick={toggleSidebar}>
            {isSidebarOpen ? <FaTimes /> : <FaBars />}
          </button>
          <h1>{title}</h1>
        </header>

        <main className="dashboard-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MachineOwnerLayout;

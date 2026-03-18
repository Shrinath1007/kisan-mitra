import React from "react";
import { NavLink } from "react-router-dom";
import {
  FaTachometerAlt,
  FaTractor,
  FaPlus,
  FaFileInvoice,
  FaChartLine,
  FaStar,
} from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import "./Sidebar.css";

const Sidebar = ({ isOpen, closeSidebar }) => {
  const { user, logout } = useAuth();

  const sidebarLinks = [
    { path: "/owner/dashboard", label: "Dashboard", icon: <FaTachometerAlt /> },
    { path: "/owner/machines", label: "My Machines", icon: <FaTractor /> },
    { path: "/owner/add-machine", label: "Add Machine", icon: <FaPlus /> },
    { path: "/owner/bookings", label: "Bookings", icon: <FaFileInvoice /> },
    { path: "/owner/earnings", label: "Earnings", icon: <FaChartLine /> },
    { path: "/owner/ratings", label: "Ratings", icon: <FaStar /> },
  ];

  return (
    <aside className={`sidebar ${isOpen ? "open" : ""}`}>
      <div className="sidebar-header">
        <h2>Kisan Mitra</h2>
        <p>Welcome, {user?.name || "Owner"}</p>
      </div>
      <nav className="sidebar-nav">
        <ul>
          {sidebarLinks.map((link) => (
            <li key={link.path}>
              <NavLink
                to={link.path}
                className={({ isActive }) =>
                  isActive ? "nav-link active" : "nav-link"
                }
                onClick={closeSidebar}
              >
                {link.icon}
                <span>{link.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="sidebar-footer">
        <button onClick={logout} className="logout-button">
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

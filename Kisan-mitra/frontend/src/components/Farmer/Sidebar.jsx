import React from "react";
import { NavLink } from "react-router-dom";
import {
  FaTachometerAlt,
  FaSeedling,
  FaUsers,
  FaTractor,
  FaBrain,
  FaHistory,
} from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import "./Sidebar.css";

const Sidebar = ({ isOpen, closeSidebar }) => {
  const { user, logout } = useAuth();

  const sidebarLinks = [
    {
      path: "/farmer/dashboard",
      label: "Dashboard",
      icon: <FaTachometerAlt />,
    },
    // { path: "/farmer/crops", label: "My Crops", icon: <FaSeedling /> },
    { path: "/farmer/vacancies", label: "Labor", icon: <FaUsers /> },
    { path: "/farmer/machinery", label: "Machinery", icon: <FaTractor /> },
    { path: "/farmer/predictions", label: "AI Predictions", icon: <FaBrain /> },
    { path: "/farmer/history", label: "Booking History", icon: <FaHistory /> },
  ];

  return (
    <aside className={`sidebar ${isOpen ? "open" : ""}`}>
      <div className="sidebar-header">
        <h2>Kisan Mitra</h2>
        <p>Welcome, {user?.name || "Farmer"}</p>
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

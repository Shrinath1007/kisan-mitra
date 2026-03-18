import React from 'react';
import { NavLink } from 'react-router-dom';
import { FaTachometerAlt, FaSearch, FaHistory, FaUser } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

const Sidebar = ({ isOpen, closeSidebar }) => {
  const { user, logout } = useAuth();

  const sidebarLinks = [
    { path: '/labour/dashboard', label: 'Dashboard', icon: <FaTachometerAlt /> },
    { path: '/labour/find-work', label: 'Find Work', icon: <FaSearch /> },
    { path: '/labour/work-history', label: 'Work History', icon: <FaHistory /> },
    { path: '/labour/profile', label: 'Profile', icon: <FaUser /> },
  ];

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <h2>Kisan Mitra</h2>
        <p>Welcome, {user?.name || 'Labour'}</p>
      </div>
      <nav className="sidebar-nav">
        <ul>
          {sidebarLinks.map((link) => (
            <li key={link.path}>
              <NavLink
                to={link.path}
                className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
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

import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const savedUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("km_user"));
    } catch {
      return null;
    }
  })();
  const savedToken = localStorage.getItem("km_token");
  const initialToken = savedToken || (savedUser && savedUser.token) || null;

  const [user, setUser] = useState(savedUser || null);
  const [token, setToken] = useState(initialToken || null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (user && token) {
      const userToStore = { ...user };
      delete userToStore.token;
      localStorage.setItem("km_user", JSON.stringify(userToStore));
      localStorage.setItem("km_token", token);
    } else {
      localStorage.removeItem("km_user");
      localStorage.removeItem("km_token");
    }
    setReady(true);
  }, [user, token]);

  const login = (userData, jwtToken) => {
    if (!userData) {
      console.error("No user data provided to login");
      return;
    }

    let userToSet;
    let tokenToSet;

    if (!jwtToken && typeof userData === "object" && userData.token) {
      tokenToSet = userData.token;
      userToSet = { ...userData };
      delete userToSet.token;
    } else {
      userToSet = userData;
      tokenToSet = jwtToken || null;
    }

    // Ensure user has a role field
    if (!userToSet.role) {
      console.warn("User data missing role field, attempting to infer from email");
      if (userToSet.email && userToSet.email.includes('admin')) {
        userToSet.role = 'admin';
      }
    }

    setUser(userToSet);
    setToken(tokenToSet);

    // Role-based redirection
    switch (userToSet.role) {
      case "farmer":
        navigate("/farmer/dashboard");
        break;
      case "labour":
        navigate("/labour/dashboard");
        break;
      case "owner":
        navigate("/owner/dashboard");
        break;
      case "admin":
        navigate("/admin/dashboard");
        break;
      default:
        console.warn("Unknown user role:", userToSet.role);
        navigate("/");
        break;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    navigate("/");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, ready }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

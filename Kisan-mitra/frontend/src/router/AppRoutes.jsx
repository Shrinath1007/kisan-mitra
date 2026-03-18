import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Home from "../pages/Home/Home";
import Login from "../pages/Auth/Login";
import Register from "../pages/Auth/Register";
import ForgotPassword from "../pages/Auth/ForgotPassword";
import NotFound from "../pages/NotFound/NotFound";

// Layouts
import FarmerLayout from "../layouts/FarmerLayout";
import LabourLayout from "../layouts/LabourLayout";
import MachineOwnerLayout from "../layouts/MachineOwnerLayout";

// Farmer Pages
import FarmerDashboard from "../pages/Farmer/Dashboard";
import FarmerCrops from "../pages/Farmer/Crops";
import FarmerVacancies from "../pages/Farmer/Vacancies";
import FarmerMachinery from "../pages/Farmer/Machinery";
import FarmerPredictions from "../pages/Farmer/Predictions";
import FarmerHistory from "../pages/Farmer/History";
import VacancyApplicants from "../pages/Farmer/VacancyApplicants";

// Labour Pages
import LabourDashboard from "../pages/Labour/Dashboard";
import FindWork from "../pages/Labour/FindWork";
import WorkHistory from "../pages/Labour/WorkHistory";
import Profile from "../pages/Labour/Profile";

// Machine Owner Pages
import MachineOwnerDashboard from "../pages/MachineOwner/Dashboard";
import MachineList from "../pages/MachineOwner/MachineList";
import AddMachineForm from "../pages/MachineOwner/AddMachineForm";
import MachineOwnerBookings from "../pages/MachineOwner/MachineOwnerBookings";
import MachineOwnerEarnings from "../pages/MachineOwner/MachineOwnerEarnings";
import MachineOwnerRatingsFeedback from "../pages/MachineOwner/MachineOwnerRatingsFeedback";

import { useAuth } from "../context/AuthContext";

import AdminDashboard from "../pages/admin/Dashboard";

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to a specific dashboard based on role if trying to access a wrong page
    const homePath = `/${user.role}/dashboard`;
    return <Navigate to={homePath} replace />;
  }

  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route
        path="/admin"
        element={<Navigate to="/admin/dashboard" replace />}
      />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* Farmer Routes */}
      <Route
        path="/farmer"
        element={
          <ProtectedRoute allowedRoles={["farmer"]}>
            <FarmerLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<FarmerDashboard />} />
        <Route path="crops" element={<FarmerCrops />} />
        <Route path="vacancies" element={<FarmerVacancies />} />
        <Route path="machinery" element={<FarmerMachinery />} />
        <Route path="predictions" element={<FarmerPredictions />} />
        <Route path="history" element={<FarmerHistory />} />
        <Route path="vacancy-applicants" element={<VacancyApplicants />} />
      </Route>

      {/* Labour Routes */}
      <Route
        path="/labour"
        element={
          <ProtectedRoute allowedRoles={["labour"]}>
            <LabourLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<LabourDashboard />} />
        <Route path="find-work" element={<FindWork />} />
        <Route path="work-history" element={<WorkHistory />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      {/* Machine Owner Routes */}
      <Route
        path="/owner"
        element={
          <ProtectedRoute allowedRoles={["owner"]}>
            <MachineOwnerLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<MachineOwnerDashboard />} />
        <Route path="machines" element={<MachineList />} />
        <Route path="add-machine" element={<AddMachineForm />} />
        {/* Add route for editing machine */}
        <Route path="edit-machine/:id" element={<AddMachineForm />} />
        <Route path="bookings" element={<MachineOwnerBookings />} />
        <Route path="earnings" element={<MachineOwnerEarnings />} />
        <Route path="ratings" element={<MachineOwnerRatingsFeedback />} />
      </Route>

      {/* Fallback Routes */}
      <Route
        path="/unauthorized"
        element={
          <div>
            <h1>Unauthorized Access</h1>
            <p>You do not have permission to view this page.</p>
          </div>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;

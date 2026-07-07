import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { PresentationProvider } from './context/PresentationContext';
import { NotificationProvider } from './context/NotificationContext';

// Layout & UI
import MainLayout from './components/layout/MainLayout';
import EmergencyOverlay from './components/shared/EmergencyOverlay';


// Pages
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';

// Citizen Pages
import CitizenDashboard from './pages/CitizenDashboard';
import SubmitReport from './pages/citizen/SubmitReport';
import MyReports from './pages/citizen/MyReports';
import VillageHealth from './pages/citizen/VillageHealth';
import Profile from './pages/citizen/Profile';
import Alerts from './pages/shared/Alerts';

// Field Worker Pages
import HealthWorkerDashboard from './pages/HealthWorkerDashboard';
import VerificationQueue from './pages/worker/VerificationQueue';
import WaterQualityTesting from './pages/worker/WaterQualityTesting';
import FieldSurveys from './pages/worker/FieldSurveys';
import WorkerVillages from './pages/worker/WorkerVillages';

// Admin Pages
import AdminDashboard from './pages/AdminDashboard';
import ManageVillages from './pages/admin/ManageVillages';
import ManageUsers from './pages/admin/ManageUsers';
import AllReports from './pages/admin/AllReports';
import Analytics from './pages/admin/Analytics';
import CommandCenterCore from './pages/admin/CommandCenterCore';
import SystemAudit from './pages/admin/SystemAudit';
import AdminAlerts from './pages/admin/Alerts';
import HealthWorkers from './pages/admin/HealthWorkers';
import Settings from './pages/admin/Settings';
import Maps from './pages/admin/Maps';
import VillageDigitalTwin from './pages/admin/VillageDigitalTwin';
import OutbreakSimulator from './pages/admin/OutbreakSimulator';
import DiseasePredictionEngine from './pages/admin/DiseasePredictionEngine';
import SihDemo from './pages/admin/SihDemo';
import WarRoom from './pages/admin/WarRoom';
import VillageIntelligence from './pages/admin/VillageIntelligence';
function App() {
  const { user } = useAuth();

  const RootRedirect = () => {
    if (!user) {
      return <Navigate to="/login" replace />;
    }
    switch (user.role) {
      case 'ADMIN':
        return <Navigate to="/admin/dashboard" replace />;
      case 'HEALTH_WORKER':
        return <Navigate to="/worker/dashboard" replace />;
      case 'CITIZEN':
      default:
        return <Navigate to="/citizen/dashboard" replace />;
    }
  };

  const ProtectedRoute = ({ children, allowedRoles }) => {
    if (!user) {
      return <Navigate to="/login" />;
    }
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      return <Navigate to="/" />; // Redirect to root which will re-route by role
    }
    // Wrap in MainLayout which contains Sidebar + responsive hamburger
    return (
      <MainLayout>
        {children}
      </MainLayout>
    );
  };

  return (
    <Router>
      <PresentationProvider>
        <NotificationProvider>
          <EmergencyOverlay />
          <Routes>
          <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<RootRedirect />} />
        
        {/* CITIZEN ROUTES */}
        <Route path="/citizen/dashboard" element={<ProtectedRoute allowedRoles={['CITIZEN']}><CitizenDashboard /></ProtectedRoute>} />
        <Route path="/citizen/report" element={<ProtectedRoute allowedRoles={['CITIZEN']}><SubmitReport /></ProtectedRoute>} />
        <Route path="/citizen/my-reports" element={<ProtectedRoute allowedRoles={['CITIZEN']}><MyReports /></ProtectedRoute>} />
        <Route path="/citizen/village-health" element={<ProtectedRoute allowedRoles={['CITIZEN']}><VillageHealth /></ProtectedRoute>} />
        <Route path="/citizen/alerts" element={<ProtectedRoute allowedRoles={['CITIZEN', 'HEALTH_WORKER']}><Alerts /></ProtectedRoute>} />
        <Route path="/citizen/profile" element={<ProtectedRoute allowedRoles={['CITIZEN', 'HEALTH_WORKER']}><Profile /></ProtectedRoute>} />

        {/* FIELD HEALTH WORKER ROUTES */}
        <Route path="/worker/dashboard" element={<ProtectedRoute allowedRoles={['HEALTH_WORKER', 'ADMIN']}><HealthWorkerDashboard /></ProtectedRoute>} />
        <Route path="/worker/queue" element={<ProtectedRoute allowedRoles={['HEALTH_WORKER', 'ADMIN']}><VerificationQueue /></ProtectedRoute>} />
        <Route path="/worker/water-testing" element={<ProtectedRoute allowedRoles={['HEALTH_WORKER', 'ADMIN']}><WaterQualityTesting /></ProtectedRoute>} />
        <Route path="/worker/surveys" element={<ProtectedRoute allowedRoles={['HEALTH_WORKER', 'ADMIN']}><FieldSurveys /></ProtectedRoute>} />
        <Route path="/worker/villages" element={<ProtectedRoute allowedRoles={['HEALTH_WORKER', 'ADMIN']}><WorkerVillages /></ProtectedRoute>} />

        {/* ADMIN ROUTES */}
        <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['ADMIN']}><ManageUsers /></ProtectedRoute>} />
        <Route path="/admin/villages" element={<ProtectedRoute allowedRoles={['ADMIN']}><ManageVillages /></ProtectedRoute>} />
        <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={['ADMIN']}><AllReports /></ProtectedRoute>} />
        <Route path="/admin/analytics" element={<ProtectedRoute allowedRoles={['ADMIN']}><Analytics /></ProtectedRoute>} />
        <Route path="/admin/ai-core" element={<ProtectedRoute allowedRoles={['ADMIN']}><CommandCenterCore /></ProtectedRoute>} />
        <Route path="/admin/audit" element={<ProtectedRoute allowedRoles={['ADMIN']}><SystemAudit /></ProtectedRoute>} />
        <Route path="/admin/alerts" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminAlerts /></ProtectedRoute>} />
        <Route path="/admin/workers" element={<ProtectedRoute allowedRoles={['ADMIN']}><HealthWorkers /></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['ADMIN']}><Settings /></ProtectedRoute>} />
        <Route path="/admin/maps" element={<ProtectedRoute allowedRoles={['ADMIN']}><Maps /></ProtectedRoute>} />
        <Route path="/admin/village-intelligence/:id" element={<ProtectedRoute allowedRoles={['ADMIN']}><VillageIntelligence /></ProtectedRoute>} />
        <Route path="/admin/villages/:id/digital-twin" element={<ProtectedRoute allowedRoles={['ADMIN']}><VillageDigitalTwin /></ProtectedRoute>} />
        <Route path="/admin/disease-predictions" element={<ProtectedRoute allowedRoles={['ADMIN']}><DiseasePredictionEngine /></ProtectedRoute>} />
        <Route path="/admin/sih-demo" element={<ProtectedRoute allowedRoles={['ADMIN']}><SihDemo /></ProtectedRoute>} />
        <Route path="/admin/outbreak-simulator" element={<ProtectedRoute allowedRoles={['ADMIN']}><OutbreakSimulator /></ProtectedRoute>} />
        <Route path="/admin/war-room" element={<ProtectedRoute allowedRoles={['ADMIN', 'HEALTH_WORKER']}><WarRoom /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </NotificationProvider>
      </PresentationProvider>
    </Router>
  );
}

export default App;

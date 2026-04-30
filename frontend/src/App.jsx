import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import RoleGuard from './components/auth/RoleGuard';
import MainLayout from './components/layout/MainLayout';

// Public pages
import Login from './pages/Login';
import Forbidden from './pages/Forbidden';
import DevTokens from './pages/DevTokens';

// Mentor pages
import Dashboard from './pages/Dashboard';
import Attendance from './pages/Attendance';
import History from './pages/History';
import Materials from './pages/Materials';
import UploadCSV from './pages/UploadCSV';

// Student pages
import MyAttendance from './pages/MyAttendance';
import Upcoming from './pages/Upcoming';
import MyMaterials from './pages/MyMaterials';

// Shared pages
import Settings from './pages/Settings';

// Index Redirect Component
function IndexRedirect() {
  const { user, role, loading } = useAuth();
  
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  
  return role === 'mentor' 
    ? <Navigate to="/dashboard" replace /> 
    : <Navigate to="/me/attendance" replace />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/403" element={<Forbidden />} />
          <Route path="/dev-tokens" element={<DevTokens />} />
          
          {/* Role-directed Root */}
          <Route path="/" element={<IndexRedirect />} />

          {/* Protected Application Routes with Shell */}
          <Route element={<MainLayout />}>
            
            {/* Mentor Only Routes */}
            <Route path="/dashboard" element={<RoleGuard allowedRoles={['mentor']}><Dashboard /></RoleGuard>} />
            <Route path="/attendance" element={<RoleGuard allowedRoles={['mentor']}><Attendance /></RoleGuard>} />
            <Route path="/history" element={<RoleGuard allowedRoles={['mentor']}><History /></RoleGuard>} />
            <Route path="/materials" element={<RoleGuard allowedRoles={['mentor']}><Materials /></RoleGuard>} />
            <Route path="/upload" element={<RoleGuard allowedRoles={['mentor']}><UploadCSV /></RoleGuard>} />

            {/* Student Only Routes */}
            <Route path="/me/attendance" element={<RoleGuard allowedRoles={['student']}><MyAttendance /></RoleGuard>} />
            <Route path="/me/upcoming" element={<RoleGuard allowedRoles={['student']}><Upcoming /></RoleGuard>} />
            <Route path="/me/materials" element={<RoleGuard allowedRoles={['student']}><MyMaterials /></RoleGuard>} />

            {/* Shared Routes (any authenticated user) */}
            <Route path="/settings" element={<RoleGuard allowedRoles={['mentor', 'student']}><Settings /></RoleGuard>} />

          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

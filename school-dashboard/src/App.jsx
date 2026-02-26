import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './hooks/useToast.jsx';
import { ThemeProvider } from './hooks/useTheme.jsx';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Teachers from './pages/Teachers';
import Classes from './pages/Classes';
import Assignments from './pages/Assignments';
import Exams from './pages/Exams';
import Results from './pages/Results';
import TimeTable from './pages/TimeTable';
import Books from './pages/Books';
import Profile from './pages/Profile';
import Calendar from './pages/Calendar';
import AdminUsers from './pages/AdminUsers';
import Files from './pages/Files';
import StudentProfile from './pages/StudentProfile';
import TeacherProfile from './pages/TeacherProfile';
import Parents from './pages/Parents';
import Attendance from './pages/Attendance';
import { useAuth } from './context/AuthContext.jsx';

function App() {
  const { token, clearAuthData } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return Boolean(token);
  });
  const [userRole, setUserRole] = useState(() => {
    return localStorage.getItem('role') || null;
  });

  useEffect(() => {
    setIsAuthenticated(Boolean(token));
  }, [token]);

  const handleLogin = (role) => {
    setIsAuthenticated(true);
    setUserRole(role);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole(null);
    localStorage.removeItem('auth');
    localStorage.removeItem('grade');
    clearAuthData();
  };

  // Simple Auth Check Wrapper (no permission check)
  const AuthRoute = ({ children }) => {
    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  return (
    <ThemeProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login onLogin={handleLogin} />} />

            <Route path="/" element={
              <AuthRoute>
                <Layout onLogout={handleLogout} />
              </AuthRoute>
            }>
              <Route index element={<Dashboard />} />

              {/* Students route - Admin and Teacher can view */}
              <Route path="students" element={
                <ProtectedRoute resource="students" permission="view">
                  <Students />
                </ProtectedRoute>
              } />
              <Route path="students/:id" element={
                <ProtectedRoute resource="students" permission="view">
                  <StudentProfile />
                </ProtectedRoute>
              } />

              {/* Teachers route - Admin and Teacher can view */}
              <Route path="teachers" element={
                <ProtectedRoute resource="teachers" permission="view">
                  <Teachers />
                </ProtectedRoute>
              } />
              <Route path="teachers/:id" element={
                <ProtectedRoute resource="teachers" permission="view">
                  <TeacherProfile />
                </ProtectedRoute>
              } />

              {/* Classes route - All roles can view */}
              <Route path="classes" element={
                <ProtectedRoute resource="classes" permission="view">
                  <Classes />
                </ProtectedRoute>
              } />

              {/* Parents route */}
              <Route path="parents" element={
                <ProtectedRoute resource="parents" permission="view">
                  <Parents />
                </ProtectedRoute>
              } />

              {/* Assignments - All roles can view */}
              <Route path="assignments" element={
                <ProtectedRoute resource="assignments" permission="view">
                  <Assignments />
                </ProtectedRoute>
              } />

              {/* Exams - All roles can view */}
              <Route path="exams" element={
                <ProtectedRoute resource="exams" permission="view">
                  <Exams />
                </ProtectedRoute>
              } />
              
              {/* Exam Results - All roles can view */}
              <Route path="results" element={
                <ProtectedRoute resource="results" permission="view">
                  <Results />
                </ProtectedRoute>
              } />

              {/* TimeTable - All roles can view */}
              <Route path="timetable" element={
                <ProtectedRoute resource="timetable" permission="view">
                  <TimeTable />
                </ProtectedRoute>
              } />

              {/* Books - All roles can view */}
              <Route path="books" element={
                <ProtectedRoute resource="books" permission="view">
                  <Books />
                </ProtectedRoute>
              } />

              {/* Files - All roles can view */}
              <Route path="files" element={
                <ProtectedRoute resource="files" permission="view">
                  <Files />
                </ProtectedRoute>
              } />

              {/* Attendance - Admin and Teacher can view */}
              <Route path="attendance" element={
                <ProtectedRoute resource="attendance" permission="view">
                  <Attendance />
                </ProtectedRoute>
              } />

              {/* Calendar - All roles can view */}
              <Route path="calendar" element={
                <ProtectedRoute resource="calendar" permission="view">
                  <Calendar />
                </ProtectedRoute>
              } />

              {/* Admin Users */}
              <Route path="admin/users" element={
                <ProtectedRoute resource="adminUsers" permission="view">
                  <AdminUsers />
                </ProtectedRoute>
              } />

              {/* Profile - All authenticated users */}
              <Route path="profile" element={<Profile />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;

import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import GlobalErrorListener from './components/GlobalErrorListener';

// Each page is its own JS chunk, fetched only when the user navigates there.
// Keeps the initial bundle (login screen) small and fast on first load.
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Feedback = lazy(() => import('./pages/Feedback'));
const AskAI = lazy(() => import('./pages/AskAI'));
const Reports = lazy(() => import('./pages/Reports'));
const Team = lazy(() => import('./pages/Team'));

function PageFallback() {
  return <div className="loading-screen">Loading…</div>;
}

export default function App() {
  return (
    <>
      <GlobalErrorListener />
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="feedback" element={<Feedback />} />
            <Route path="ask-ai" element={<AskAI />} />
            <Route path="reports" element={<Reports />} />
            <Route path="team" element={<Team />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  );
}

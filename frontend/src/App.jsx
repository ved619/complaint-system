import { Routes, Route, Navigate } from "react-router-dom";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import ComplaintDetail from "./pages/ComplaintDetail";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Auth />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/complaints/:id"
        element={
          <ProtectedRoute>
            <ComplaintDetail />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;

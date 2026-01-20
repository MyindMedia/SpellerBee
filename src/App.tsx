import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAppStore } from "@/store/useAppStore";
import Home from "@/pages/Home";
import Welcome from "@/pages/Welcome";
import Tutorial from "@/pages/Tutorial";
import Awards from "@/pages/Awards";
import Landing from "@/pages/Landing";
import ParentLogin from "@/pages/ParentLogin";
import ParentDashboard from "@/pages/ParentDashboard";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const childName = useAppStore((state) => state.childName);
  if (!childName) return <Navigate to="/welcome" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/tutorial" element={<Tutorial />} />
        <Route path="/parent/login" element={<ParentLogin />} />
        <Route path="/parent/dashboard" element={<ParentDashboard />} />
        <Route 
          path="/play" 
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/awards" 
          element={
            <ProtectedRoute>
              <Awards />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

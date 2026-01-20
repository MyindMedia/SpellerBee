import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAppStore } from "@/store/useAppStore";
import Home from "@/pages/Home";
import Welcome from "@/pages/Welcome";
import Tutorial from "@/pages/Tutorial";
import Awards from "@/pages/Awards";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const childName = useAppStore((state) => state.childName);
  if (!childName) return <Navigate to="/welcome" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/tutorial" element={<Tutorial />} />
        <Route 
          path="/" 
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

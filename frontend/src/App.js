import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Toaster } from "./components/ui/sonner";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import Ledger from "./pages/Ledger";
import MasterData from "./pages/MasterData";
import UsersPage from "./pages/Users";
import Discrepancies from "./pages/Discrepancies";
import Procurement from "./pages/Procurement";
import Settings from "./pages/Settings";
import Approvals from "./pages/Approvals";
import PartnerPortal from "./pages/PartnerPortal";
import Boardroom from "./pages/ClientView";

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading)
    return <div className="min-h-screen flex items-center justify-center text-[#0091FF] font-mono font-semibold">INITIALIZING ECO-PRECISION IMS…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  const location = useLocation();

  const isAuthRoute = location.pathname === "/login" || location.pathname === "/signup";
  const routeKey = isAuthRoute ? location.pathname : "app-layout";

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={routeKey}>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          element={
            <Protected>
              <Layout />
            </Protected>
          }
        >
          <Route path="/" element={user?.role === "client" ? <Boardroom /> : user?.role === "partner" ? <PartnerPortal /> : <Dashboard />} />
          <Route path="/partner" element={<PartnerPortal />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/procurement" element={<Procurement />} />
          <Route path="/ledger" element={<Ledger />} />
          <Route path="/discrepancies" element={<Discrepancies />} />
          <Route path="/approvals" element={<Approvals />} />
          <Route path="/master-data" element={<MasterData />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/boardroom" element={<Boardroom />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
          <Toaster position="top-right" theme="light" richColors />
        </BrowserRouter>
      </AuthProvider>
    </div>
  );
}

export default App;

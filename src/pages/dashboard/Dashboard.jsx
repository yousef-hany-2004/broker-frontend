import useAuth from "../../hooks/useAuth";
import LandlordDashboard from "./LandlordDashboard";
import ClientDashboard from "./ClientDashboard";
import AdminDashboard from "./AdminDashboard";
import SuperAdminDashboard from "./SuperAdminDashboard";

function Dashboard() {
  const { user } = useAuth();
  const roles = user?.roles || [];

  if (roles.includes("SuperAdmin")) return <SuperAdminDashboard />;
  if (roles.includes("Admin")) return <AdminDashboard />;
  if (roles.includes("Landlord")) return <LandlordDashboard />;
  return <ClientDashboard />;
}

export default Dashboard;

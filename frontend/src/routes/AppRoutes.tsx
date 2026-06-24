import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { MainLayout } from '../layouts/MainLayout';
import { RouteGuard } from '../components/common/RouteGuard';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { InternetPage } from '../pages/InternetPage';
import { WifiFriendlyPage } from '../pages/WifiFriendlyPage';
import { WanPage } from '../pages/WanPage';
import { LanPage } from '../pages/LanPage';
import { FirewallPage } from '../pages/FirewallPage';
import { LogsPage } from '../pages/LogsPage';
import { DiagnosticPage } from '../pages/DiagnosticPage';
import { ManagementPage } from '../pages/ManagementPage';
import { HostsPage } from '../pages/HostsPage';
import { SpeedTestPage } from '../pages/SpeedTestPage';
import { SecurityAdvancedPage } from '../pages/SecurityAdvancedPage';
import { Tr069ManagementPage } from '../pages/tr069/Tr069ManagementPage';
import { Tr069EventViewerPage } from '../pages/tr069/Tr069EventViewerPage';
import { ParameterExplorerPage } from '../pages/tr069/ParameterExplorerPage';
import { DhcpPage } from '../pages/DhcpPage';
import { RoutingPage } from '../pages/RoutingPage';
import { NatPage } from '../pages/NatPage';
import { PortForwardPage } from '../pages/PortForwardPage';
import { UpnpPage } from '../pages/UpnpPage';
import { SystemInfoPage, PonOpticalPage, PonOnuPage } from '../pages/SystemInfoPage';
import { SecurityCenterPage } from '../pages/SecurityCenterPage';
import { ForcePasswordChangeDialog } from '../components/security/ForcePasswordChangeDialog';

function ProtectedLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return (
    <MainLayout>
      <ForcePasswordChangeDialog />
      <RouteGuard>
        <Outlet />
      </RouteGuard>
    </MainLayout>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/internet" element={<InternetPage />} />
        <Route path="/wifi" element={<WifiFriendlyPage />} />
        <Route path="/hosts" element={<HostsPage />} />
        <Route path="/wan" element={<WanPage />} />
        <Route path="/lan" element={<LanPage />} />
        <Route path="/dhcp" element={<DhcpPage />} />
        <Route path="/routing" element={<RoutingPage />} />
        <Route path="/wireless" element={<Navigate to="/wifi" replace />} />
        <Route path="/wifi-advanced" element={<Navigate to="/wifi" replace />} />
        <Route path="/security" element={<SecurityCenterPage />} />
        <Route path="/firewall" element={<FirewallPage />} />
        <Route path="/nat" element={<NatPage />} />
        <Route path="/port-forward" element={<PortForwardPage />} />
        <Route path="/upnp" element={<UpnpPage />} />
        <Route path="/security-advanced" element={<SecurityAdvancedPage />} />
        <Route path="/tr069/management" element={<Tr069ManagementPage />} />
        <Route path="/tr069/events" element={<Tr069EventViewerPage />} />
        <Route path="/tr069/parameters" element={<ParameterExplorerPage />} />
        <Route path="/logs" element={<LogsPage />} />
        <Route path="/diagnostic" element={<DiagnosticPage />} />
        <Route path="/speedtest" element={<SpeedTestPage />} />
        <Route path="/management" element={<ManagementPage />} />
        <Route path="/system" element={<SystemInfoPage />} />
        <Route path="/pon/optical" element={<PonOpticalPage />} />
        <Route path="/pon/onu" element={<PonOnuPage />} />
      </Route>
      <Route path="/network-advanced" element={<Navigate to="/routing" replace />} />
      <Route path="/ont" element={<Navigate to="/pon/optical" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

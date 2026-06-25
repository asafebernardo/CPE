import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { MainLayout } from '../layouts/MainLayout';
import { RouteGuard } from '../components/common/RouteGuard';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { InternetPage } from '../pages/InternetPage';
import { WirelessPage } from '../pages/WirelessPage';
import { FirewallPage } from '../pages/FirewallPage';
import { DiagnosticsPage } from '../pages/DiagnosticsPage';
import { HostsPage } from '../pages/HostsPage';
import { SecurityAdvancedPage } from '../pages/SecurityAdvancedPage';
import { NetworkPage } from '../pages/NetworkPage';
import { NatPage } from '../pages/NatPage';
import { PortForwardPage } from '../pages/PortForwardPage';
import { UpnpPage } from '../pages/UpnpPage';
import { SecurityCenterPage } from '../pages/SecurityCenterPage';
import { SystemHubPage } from '../pages/SystemHubPage';
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
        <Route path="/wifi" element={<WirelessPage />} />
        <Route path="/wifi/networks" element={<WirelessPage />} />
        <Route path="/wifi/band-steering" element={<WirelessPage />} />
        <Route path="/wifi/guest" element={<WirelessPage />} />
        <Route path="/wifi/mesh" element={<WirelessPage />} />
        <Route path="/wifi/neighbors" element={<Navigate to="/diagnostics/neighbors" replace />} />
        <Route path="/wifi/guest-mesh" element={<Navigate to="/wifi/guest" replace />} />
        <Route path="/hosts" element={<HostsPage />} />
        <Route path="/network" element={<Navigate to="/network/wan" replace />} />
        <Route path="/network/wan" element={<NetworkPage />} />
        <Route path="/network/lan" element={<NetworkPage />} />
        <Route path="/network/routing" element={<NetworkPage />} />
        <Route path="/network/tr069" element={<NetworkPage />} />
        <Route path="/wan" element={<Navigate to="/network/wan" replace />} />
        <Route path="/lan" element={<Navigate to="/network/lan" replace />} />
        <Route path="/dhcp" element={<Navigate to="/network/lan" replace />} />
        <Route path="/routing" element={<Navigate to="/network/routing" replace />} />
        <Route path="/wireless" element={<Navigate to="/wifi/networks" replace />} />
        <Route path="/wifi-advanced" element={<Navigate to="/wifi/networks" replace />} />
        <Route path="/security" element={<SecurityCenterPage />} />
        <Route path="/security/users" element={<Navigate to="/system/users" replace />} />
        <Route path="/firewall" element={<FirewallPage />} />
        <Route path="/nat" element={<NatPage />} />
        <Route path="/port-forward" element={<PortForwardPage />} />
        <Route path="/upnp" element={<UpnpPage />} />
        <Route path="/security-advanced" element={<SecurityAdvancedPage />} />
        <Route path="/tr069/management" element={<Navigate to="/network/tr069" replace />} />
        <Route path="/tr069/events" element={<Navigate to="/network/tr069" replace />} />
        <Route path="/tr069/parameters" element={<Navigate to="/network/tr069" replace />} />
        <Route path="/network/tr069/management" element={<Navigate to="/network/tr069" replace />} />
        <Route path="/network/tr069/events" element={<Navigate to="/network/tr069" replace />} />
        <Route path="/network/tr069/parameters" element={<Navigate to="/network/tr069" replace />} />
        <Route path="/logs" element={<Navigate to="/system/logs" replace />} />
        <Route path="/management" element={<Navigate to="/system/backup" replace />} />
        <Route path="/diagnostics" element={<DiagnosticsPage />} />
        <Route path="/diagnostics/ping" element={<DiagnosticsPage />} />
        <Route path="/diagnostics/traceroute" element={<DiagnosticsPage />} />
        <Route path="/diagnostics/neighbors" element={<DiagnosticsPage />} />
        <Route path="/diagnostics/speedtest" element={<DiagnosticsPage />} />
        <Route path="/diagnostic" element={<Navigate to="/diagnostics/ping" replace />} />
        <Route path="/speedtest" element={<Navigate to="/diagnostics/speedtest" replace />} />
        <Route path="/system" element={<SystemHubPage />} />
        <Route path="/system/info" element={<SystemHubPage />} />
        <Route path="/system/users" element={<SystemHubPage />} />
        <Route path="/system/backup" element={<SystemHubPage />} />
        <Route path="/system/firmware" element={<SystemHubPage />} />
        <Route path="/system/actions" element={<SystemHubPage />} />
        <Route path="/system/logs" element={<SystemHubPage />} />
        <Route path="/pon/optical" element={<Navigate to="/system/info" replace />} />
        <Route path="/pon/onu" element={<Navigate to="/system/info" replace />} />
      </Route>
      <Route path="/network-advanced" element={<Navigate to="/network/routing" replace />} />
      <Route path="/ont" element={<Navigate to="/system/info" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

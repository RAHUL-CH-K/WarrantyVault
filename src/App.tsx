import { VaultProvider, useVault } from './context/VaultContext';
import { LayoutShell } from './components/LayoutShell';
import { VaultDashboard } from './components/VaultDashboard';
import { AssetDetailView } from './components/AssetDetailView';
import { ClaimPacketView } from './components/ClaimPacketView';
import { SharedVaultView } from './components/SharedVaultView';
import { RemindersSettingsView } from './components/RemindersSettingsView';
import { LoginOtpView } from './components/LoginOtpView';
import { AddBillModal } from './components/AddBillModal';
import { VerificationModal } from './components/VerificationModal';

function WarrantyVaultRouter() {
  const { currentView } = useVault();

  return (
    <LayoutShell>
      {currentView === 'login' && <LoginOtpView />}
      {currentView === 'dashboard' && <VaultDashboard />}
      {currentView === 'asset-detail' && <AssetDetailView />}
      {currentView === 'claim-packets' && <ClaimPacketView />}
      {currentView === 'shared-vault' && <SharedVaultView />}
      {(currentView === 'reminders' || currentView === 'settings') && (
        <RemindersSettingsView />
      )}
      <AddBillModal />
      <VerificationModal />
    </LayoutShell>
  );
}

export default function App() {
  return (
    <VaultProvider>
      <WarrantyVaultRouter />
    </VaultProvider>
  );
}

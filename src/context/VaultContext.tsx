import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  AnimatedVideoClip,
  AppView,
  AssetItem,
  SharedMember,
  ToastMessage,
  UserProfile,
} from '../types/vault';
import {
  INITIAL_ASSETS,
  INITIAL_MEMBERS,
  INITIAL_PROFILE,
  SERIAL_STICKER_IMG,
} from '../data/mockVaultData';
import { addMonthsToIso } from '../utils/formatters';

interface VaultContextValue {
  assets: AssetItem[];
  members: SharedMember[];
  profile: UserProfile;
  currentView: AppView;
  selectedAssetId: string;
  verificationAssetId: string | null;
  addBillOpen: boolean;
  isLoading: boolean;
  hasError: boolean;
  toasts: ToastMessage[];
  setCurrentView: (view: AppView) => void;
  openAssetDetail: (id: string) => void;
  openClaimPacket: (id?: string) => void;
  openVerificationModal: (id: string) => void;
  closeVerificationModal: () => void;
  setAddBillOpen: (open: boolean) => void;
  updateAsset: (id: string, patch: Partial<AssetItem>) => void;
  confirmVerification: (id: string, updates: Partial<AssetItem>) => void;
  addAsset: (asset: AssetItem) => void;
  deleteAsset: (id: string) => void;
  linkQrSerial: (
    id: string,
    serialNumber: string,
    model?: string,
    capturedStickerDataUrl?: string
  ) => void;
  addAnimatedVideo: (id: string, clip: AnimatedVideoClip) => void;
  inviteMember: (phone: string, name: string, role: SharedMember['role']) => boolean;
  removeMember: (id: string) => void;
  updateProfile: (patch: Partial<UserProfile>) => void;
  clearAllData: () => void;
  resetDemoData: () => void;
  triggerRefresh: () => void;
  triggerSimulatedError: (enable: boolean) => void;
  addToast: (
    title: string,
    description?: string,
    variant?: ToastMessage['variant']
  ) => void;
  dismissToast: (id: string) => void;
}

const STORAGE_KEY = 'warrantyvault_state_v1';

const VaultContext = createContext<VaultContextValue | null>(null);

export function VaultProvider({ children }: { children: React.ReactNode }) {
  const [assets, setAssets] = useState<AssetItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.assets)) return parsed.assets;
      }
    } catch {
      // ignore storage errors
    }
    return INITIAL_ASSETS;
  });

  const [members, setMembers] = useState<SharedMember[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.members)) return parsed.members;
      }
    } catch {
      // ignore
    }
    return INITIAL_MEMBERS;
  });

  const [profile, setProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.profile) return parsed.profile;
      }
    } catch {
      // ignore
    }
    return INITIAL_PROFILE;
  });

  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [selectedAssetId, setSelectedAssetId] = useState<string>(
    INITIAL_ASSETS[0].id
  );
  const [verificationAssetId, setVerificationAssetId] = useState<string | null>(
    null
  );
  const [addBillOpen, setAddBillOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ assets, members, profile })
      );
    } catch {
      // ignore quota errors
    }
  }, [assets, members, profile]);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const addToast = (
    title: string,
    description?: string,
    variant: ToastMessage['variant'] = 'success'
  ) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { id, title, description, variant }]);
    setTimeout(() => {
      dismissToast(id);
    }, 3800);
  };

  const openAssetDetail = (id: string) => {
    setSelectedAssetId(id);
    setCurrentView('asset-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openClaimPacket = (id?: string) => {
    if (id) setSelectedAssetId(id);
    setCurrentView('claim-packets');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openVerificationModal = (id: string) => {
    setVerificationAssetId(id);
  };

  const closeVerificationModal = () => {
    setVerificationAssetId(null);
  };

  const updateAsset = (id: string, patch: Partial<AssetItem>) => {
    setAssets((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const next = { ...item, ...patch };
        if (patch.purchaseDate !== undefined || patch.warrantyMonths !== undefined) {
          next.expiryDate = addMonthsToIso(
            next.purchaseDate,
            next.warrantyMonths
          );
        }
        return next;
      })
    );
  };

  const confirmVerification = (id: string, updates: Partial<AssetItem>) => {
    setAssets((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const next = {
          ...item,
          ...updates,
          needsConfirmation: false,
          lowConfidenceFields: [],
        };
        next.expiryDate = addMonthsToIso(
          next.purchaseDate,
          next.warrantyMonths
        );
        return next;
      })
    );
    setVerificationAssetId(null);
    addToast('Bill verified & saved', 'Warranty timeline and readiness updated.');
  };

  const addAsset = (asset: AssetItem) => {
    setAssets((prev) => [asset, ...prev]);
    addToast(
      `${asset.brand} ${asset.productName} added`,
      'Stored in your encrypted vault.'
    );
  };

  const deleteAsset = (id: string) => {
    const target = assets.find((a) => a.id === id);
    const remaining = assets.filter((a) => a.id !== id);
    setAssets(remaining);
    if (selectedAssetId === id && remaining.length > 0) {
      setSelectedAssetId(remaining[0].id);
    }
    setCurrentView('dashboard');
    addToast(
      'Asset deleted',
      target ? `${target.brand} ${target.productName} removed from vault.` : undefined,
      'info'
    );
  };

  const linkQrSerial = (
    id: string,
    serialNumber: string,
    model?: string,
    capturedStickerDataUrl?: string
  ) => {
    setAssets((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        return {
          ...item,
          serialNumber,
          model: model || item.model,
          serialStickerUrl:
            capturedStickerDataUrl || item.serialStickerUrl || SERIAL_STICKER_IMG,
          needsConfirmation: false,
          lowConfidenceFields: item.lowConfidenceFields.filter(
            (f) => f !== 'serialNumber'
          ),
        };
      })
    );
    addToast(
      'Serial sticker linked via QR',
      `Serial ${serialNumber} verified and saved.`
    );
  };

  const addAnimatedVideo = (id: string, clip: AnimatedVideoClip) => {
    setAssets((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        return {
          ...item,
          animatedVideos: [clip, ...(item.animatedVideos || [])],
        };
      })
    );
    addToast(
      'Claim video proof generated',
      `Saved ${clip.aspectRatio} clip to asset record.`
    );
  };

  const inviteMember = (
    phone: string,
    name: string,
    role: SharedMember['role']
  ): boolean => {
    const invitedCount = members.filter((m) => m.role !== 'Owner').length;
    if (invitedCount >= 3) {
      addToast(
        'Member limit reached',
        'Maximum 3 invited members allowed on this vault.',
        'error'
      );
      return false;
    }
    const cleaned = phone.replace(/\D/g, '').slice(-10);
    if (cleaned.length !== 10) {
      addToast(
        'Invalid mobile number',
        'Enter a valid 10-digit Indian mobile number.',
        'error'
      );
      return false;
    }
    const formattedPhone = `${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
    const newMember: SharedMember = {
      id: `member-${Date.now()}`,
      name: name.trim() || 'Vault Member',
      phone: formattedPhone,
      role,
      addedAt: new Date().toISOString().slice(0, 10),
    };
    setMembers((prev) => [...prev, newMember]);
    addToast(
      'Vault invite sent on WhatsApp',
      `${newMember.name} (+91 ${formattedPhone}) added as ${role}.`
    );
    return true;
  };

  const removeMember = (id: string) => {
    const target = members.find((m) => m.id === id);
    if (!target || target.role === 'Owner') return;
    setMembers((prev) => prev.filter((m) => m.id !== id));
    addToast('Access revoked', `${target.name} removed from shared vault.`, 'info');
  };

  const updateProfile = (patch: Partial<UserProfile>) => {
    setProfile((prev) => ({ ...prev, ...patch }));
    addToast('Profile updated', 'Your WhatsApp notification settings are saved.');
  };

  const clearAllData = () => {
    setAssets([]);
    setMembers([INITIAL_MEMBERS[0]]);
    localStorage.removeItem(STORAGE_KEY);
    setCurrentView('dashboard');
    addToast(
      'Vault data deleted',
      'All records cleared in accordance with DPDP privacy controls.',
      'info'
    );
  };

  const resetDemoData = () => {
    setAssets(INITIAL_ASSETS);
    setMembers(INITIAL_MEMBERS);
    setProfile(INITIAL_PROFILE);
    setSelectedAssetId(INITIAL_ASSETS[0].id);
    setHasError(false);
    addToast('Sample vault restored', 'Loaded 8 realistic household & clinic assets.');
  };

  const triggerRefresh = () => {
    setHasError(false);
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 550);
  };

  const triggerSimulatedError = (enable: boolean) => {
    setHasError(enable);
  };

  return (
    <VaultContext.Provider
      value={{
        assets,
        members,
        profile,
        currentView,
        selectedAssetId,
        verificationAssetId,
        addBillOpen,
        isLoading,
        hasError,
        toasts,
        setCurrentView,
        openAssetDetail,
        openClaimPacket,
        openVerificationModal,
        closeVerificationModal,
        setAddBillOpen,
        updateAsset,
        confirmVerification,
        addAsset,
        deleteAsset,
        linkQrSerial,
        addAnimatedVideo,
        inviteMember,
        removeMember,
        updateProfile,
        clearAllData,
        resetDemoData,
        triggerRefresh,
        triggerSimulatedError,
        addToast,
        dismissToast,
      }}
    >
      {children}
    </VaultContext.Provider>
  );
}

export function useVault() {
  const ctx = useContext(VaultContext);
  if (!ctx) throw new Error('useVault must be used within VaultProvider');
  return ctx;
}

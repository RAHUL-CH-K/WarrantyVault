export type WarrantyStatus =
  | 'active'
  | 'expiring_soon'
  | 'missing_serial'
  | 'expired';

export type AssetCategory = 'appliance' | 'electronics' | 'power' | 'medical';

export type AppView =
  | 'dashboard'
  | 'asset-detail'
  | 'claim-packets'
  | 'shared-vault'
  | 'reminders'
  | 'settings'
  | 'login';

export type SortOption = 'expiry' | 'value' | 'recent';
export type FilterOption = 'all' | WarrantyStatus;

export interface AnimatedVideoClip {
  id: string;
  dataUrl: string;
  aspectRatio: '16:9' | '9:16';
  prompt: string;
  createdAt: string;
}

export interface AssetItem {
  id: string;
  brand: string;
  productName: string;
  model: string;
  category: AssetCategory;
  serialNumber: string | null;
  purchaseDate: string; // YYYY-MM-DD
  warrantyMonths: number;
  expiryDate: string; // YYYY-MM-DD
  sellerGstin: string;
  amountInr: number;
  gstEligible: boolean;
  needsConfirmation: boolean;
  lowConfidenceFields: string[];
  invoiceOriginalUrl: string;
  invoiceRestoredUrl: string;
  serialStickerUrl: string | null;
  supportName: string;
  supportPhone: string;
  addedAt: string; // ISO
  notes?: string;
  animatedVideos: AnimatedVideoClip[];
}

export interface SharedMember {
  id: string;
  name: string;
  phone: string;
  role: 'Owner' | 'Family' | 'CA / Tax' | 'Clinic Staff';
  addedAt: string;
}

export interface UserProfile {
  name: string;
  phone: string; // 10-digit mobile without +91
  vaultName: string;
}

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant?: 'success' | 'info' | 'error';
}

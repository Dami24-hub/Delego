export type DelegationPermissionLevel = "VIEW_ONLY" | "AUTO_APPROVE" | "SIGNER" | "ADMIN";

export interface DelegationPolicy {
  maxPerTransaction: bigint;
  maxTotal: bigint;
  allowedMerchants: string[];
  allowedCategories?: string[];
  expiresAt?: string | null;
}

export interface Delegation {
  id: string;
  userId: string;
  agentId: string;
  walletId?: string;
  label?: string;
  status: "active" | "paused" | "revoked" | "expired" | "pending";
  permissionLevel?: DelegationPermissionLevel;
  policy: DelegationPolicy;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CreateDelegationInput {
  agentId: string;
  walletId: string;
  label: string;
  permissionLevel: DelegationPermissionLevel;
  policy: {
    maxPerTransaction: string;
    maxTotal: string;
    allowedMerchants: string[];
    allowedCategories?: string[];
    expiresAt?: string;
  };
}

export interface UpdateDelegationInput {
  status?: Delegation["status"];
  policy?: {
    maxPerTransaction?: string;
    maxTotal?: string;
    allowedMerchants?: string[];
    allowedCategories?: string[];
    expiresAt?: string;
  };
}

export type OrderStatus = "pending" | "approved" | "rejected" | "completed" | "failed" | "canceled";

export interface Order {
  id: string;
  delegationId: string;
  merchantName: string;
  amount: bigint | string | number;
  currency: string;
  status: OrderStatus;
  createdAt: Date | string;
  updatedAt?: Date | string;
  items?: Array<{ name: string; price: number; quantity: number }>;
}

export type EscrowStatus = "funded" | "released" | "disputed" | "refunded";

export interface Escrow {
  id: string;
  orderId: string;
  buyerId: string;
  sellerId: string;
  amount: bigint | string | number;
  status: EscrowStatus;
  createdAt: Date | string;
}

export const ESCROW_STATUS_META: Record<EscrowStatus, { label: string; tone: "success" | "pending" | "failed" | "refunded" }>;

export interface User {
  id: string;
  email: string;
  name?: string;
  walletAddress?: string;
}

export interface UserPreferences {
  currency: string;
  theme: "light" | "dark" | "system";
  notificationsEnabled: boolean;
}

export interface ApiError {
  code: string;
  message: string;
}

export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
}

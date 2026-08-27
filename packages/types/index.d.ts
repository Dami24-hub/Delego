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

export type OrderStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "escrowed"
  | "fulfilled"
  | "settled"
  | "cancelled"
  | "disputed";

export interface OrderLineItem {
  productId: string;
  quantity: number;
  /** Stroops (1 XLM = 10,000,000 stroops) */
  unitPriceStroops: bigint;
}

export interface Order {
  id: string;
  userId: string;
  delegationId: string;
  merchantId: string;
  status: OrderStatus;
  /** Stroops (1 XLM = 10,000,000 stroops) */
  totalStroops: bigint;
  /** Portion of totalStroops charged as a platform/network fee, when known. */
  feeStroops?: bigint;
  lineItems: OrderLineItem[];
  escrowContractId: string | null;
  rejectionReason?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export type EscrowStatus = "Funded" | "Released" | "Refunded" | "Disputed";

export interface Escrow {
  escrowId: string;
  orderId: string;
  /** Stroops as a string-encoded bigint */
  amount: string;
  buyer: string;
  seller: string;
  token: string;
  status: EscrowStatus;
  timeoutLedger: number;
  currentLedger?: number;
  /** Arbiter address assigned to resolve a dispute on this escrow, when known. */
  arbiter?: string | null;
  createdAt: string;
}

export const ESCROW_STATUS_META: Record<
  EscrowStatus,
  { label: string; color: string; bg: string }
>;

// ---------------------------------------------------------------------------
// Disputes
// ---------------------------------------------------------------------------

export type DisputeReason = "item_not_received" | "not_as_described" | "other";

export type DisputeStatus =
  | "open"
  | "under_review"
  | "resolved_buyer"
  | "resolved_seller"
  | "resolved_split";

export interface Dispute {
  id: string;
  escrowId: string;
  orderId: string;
  reason: DisputeReason;
  description: string;
  evidenceUrls: string[];
  status: DisputeStatus;
  arbiter?: string | null;
  openedBy: string;
  resolutionNote?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  resolvedAt?: Date | string | null;
}

export interface CreateDisputeInput {
  reason: DisputeReason;
  description: string;
  evidenceUrls: string[];
}

// ---------------------------------------------------------------------------
// Contract registry / versions
// ---------------------------------------------------------------------------

export type ContractName = "escrow" | "permissions" | "registry";

export interface ContractVersionInfo {
  name: ContractName;
  /** Deployed contract version/build identifier, as reported by the contract's version getter. */
  version: string;
}

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

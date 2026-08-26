/**
 * Offline Mutation Queue with Replay and Conflict Resolution (#618)
 *
 * Queues approved mutation classes (approval decisions: approveOrder, rejectOrder,
 * and delegation operations: updateDelegation, revokeDelegation) in IndexedDB
 * with idempotency keys when offline. Replays queued mutations in order upon reconnect
 * or periodic sweep. Handles 409 Conflicts by flagging for explicit user resolution.
 */

export type MutationClass =
  | "approve_order"
  | "reject_order"
  | "update_delegation"
  | "revoke_delegation";

export type QueueStatus = "pending" | "replaying" | "conflict" | "quarantined";

export interface QueuedMutation {
  /** Unique Queue Item ID */
  id: string;
  /** Deduplication / Idempotency Key sent to backend */
  idempotencyKey: string;
  /** Mutation type */
  mutationClass: MutationClass;
  /** Targeted orderId or delegationId */
  resourceId: string;
  /** Arguments / payload for the mutation */
  payload: Record<string, unknown>;
  /** Timestamp created (epoch ms) */
  createdAt: number;
  /** Current status */
  status: QueueStatus;
  /** Error message if quarantined or failed */
  errorMessage?: string;
  /** Server state returned on 409 conflict */
  conflictServerState?: Record<string, unknown>;
}

const DB_NAME = "delego_offline_mutations_db";
const DB_VERSION = 1;
const STORE_NAME = "queued_mutations";

function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `id_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/** Open or upgrade the IndexedDB queue database. */
export function openQueueDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is not supported in this environment"));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("resourceId", "resourceId", { unique: false });
        store.createIndex("status", "status", { unique: false });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** Add a new mutation to the offline queue with a generated idempotency key. */
export async function enqueueMutation(
  mutationClass: MutationClass,
  resourceId: string,
  payload: Record<string, unknown> = {}
): Promise<QueuedMutation> {
  const item: QueuedMutation = {
    id: generateUUID(),
    idempotencyKey: generateUUID(),
    mutationClass,
    resourceId,
    payload,
    createdAt: Date.now(),
    status: "pending",
  };

  try {
    const db = await openQueueDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.add(item);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    // Fallback in case IndexedDB write fails
    console.warn("Failed to write to IndexedDB queue:", err);
  }

  notifyQueueListeners();
  return item;
}

/** Retrieve all items in the queue sorted by createdAt. */
export async function getQueuedMutations(): Promise<QueuedMutation[]> {
  try {
    const db = await openQueueDb();
    return await new Promise<QueuedMutation[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const res = (req.result as QueuedMutation[]).sort(
          (a, b) => a.createdAt - b.createdAt
        );
        resolve(res);
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

/** Get all pending mutations for a specific resource ID. */
export async function getMutationsByResource(
  resourceId: string
): Promise<QueuedMutation[]> {
  const all = await getQueuedMutations();
  return all.filter((item) => item.resourceId === resourceId);
}

/** Update status or error details of a queued mutation. */
export async function updateMutationStatus(
  id: string,
  status: QueueStatus,
  extra?: { errorMessage?: string; conflictServerState?: Record<string, unknown> }
): Promise<void> {
  try {
    const db = await openQueueDb();
    const existing = await new Promise<QueuedMutation | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result as QueuedMutation | undefined);
      req.onerror = () => reject(req.error);
    });

    if (!existing) return;

    const updated: QueuedMutation = {
      ...existing,
      status,
      ...(extra?.errorMessage !== undefined && { errorMessage: extra.errorMessage }),
      ...(extra?.conflictServerState !== undefined && {
        conflictServerState: extra.conflictServerState,
      }),
    };

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(updated);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    /* ignore */
  }
  notifyQueueListeners();
}

/** Remove a mutation item from the queue. */
export async function removeMutation(id: string): Promise<void> {
  try {
    const db = await openQueueDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    /* ignore */
  }
  notifyQueueListeners();
}

/** Clear all entries from the queue. */
export async function clearQueue(): Promise<void> {
  try {
    const db = await openQueueDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    /* ignore */
  }
  notifyQueueListeners();
}

// Global listener system for UI reactivity on queue changes
type QueueListener = (queue: QueuedMutation[]) => void;
const listeners = new Set<QueueListener>();

export function subscribeToQueue(listener: QueueListener): () => void {
  listeners.add(listener);
  getQueuedMutations().then(listener);
  return () => listeners.delete(listener);
}

function notifyQueueListeners(): void {
  getQueuedMutations().then((queue) => {
    for (const listener of listeners) {
      listener(queue);
    }
  });
}

import { delegationHandlers } from "./delegations";
import { orderHandlers } from "./orders";
import { escrowHandlers } from "./escrows";
import { healthHandlers } from "./health";

/**
 * Default handler set for tests, Storybook, and dev-mode mocking (FE-045).
 *
 * Individual test files can override a single resource with a scenario
 * variant (see mocks/handlers/{delegations,orders,escrows}.ts) via
 * `server.use(delegationHandlersEmpty)` / `worker.use(...)`.
 */
export const handlers = [
  ...delegationHandlers,
  ...orderHandlers,
  ...escrowHandlers,
  ...healthHandlers,
];

export {
  delegationHandlers,
  delegationHandlersEmpty,
  delegationHandlersError,
  delegationHandlersPaginated,
  resetDelegations,
} from "./delegations";
export {
  orderHandlers,
  orderHandlersEmpty,
  orderHandlersError,
  orderHandlersPaginated,
  resetOrders,
} from "./orders";
export {
  escrowHandlers,
  escrowHandlersEmpty,
  escrowHandlersError,
  escrowHandlersPaginated,
} from "./escrows";
export { healthHandlers } from "./health";

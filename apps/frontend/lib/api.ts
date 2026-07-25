import { DelegoClient } from "@delego/sdk";
import { env } from "./env";

/** Shared API client instance for the web app */
export const api = new DelegoClient({
  baseUrl: env.NEXT_PUBLIC_API_URL,
});

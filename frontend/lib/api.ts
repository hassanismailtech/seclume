import { BRAND_NAME } from "@/lib/brand.mjs";
import type {
  SeedResponse,
  Stats,
  TicketResponse,
  WireTap,
} from "@/lib/types";

export const AEGIS_URL = (
  process.env.NEXT_PUBLIC_AEGIS_URL ?? "http://localhost:8000"
).replace(/\/+$/, "");
export const AEGIS_TOKEN = process.env.NEXT_PUBLIC_AEGIS_TOKEN;

export function aegisHeaders(): HeadersInit {
  return AEGIS_TOKEN ? { "X-Aegis-Demo-Token": AEGIS_TOKEN } : {};
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${AEGIS_URL}${path}`, {
    cache: "no-store",
    headers: aegisHeaders(),
  });
  if (!response.ok) {
    throw new Error(`${BRAND_NAME} ${path} returned ${response.status}`);
  }
  return (await response.json()) as T;
}

export function fetchStats(): Promise<Stats> {
  return getJson<Stats>("/v1/aegis/stats");
}

export function fetchWireTap(requestId: string): Promise<WireTap> {
  return getJson<WireTap>(
    `/v1/aegis/wiretap/${encodeURIComponent(requestId)}`,
  );
}

export async function fetchTicket(): Promise<string> {
  const response = await fetch(`${AEGIS_URL}/v1/aegis/ticket`, {
    method: "POST",
    cache: "no-store",
    headers: aegisHeaders(),
  });
  if (!response.ok) {
    throw new Error(`${BRAND_NAME} ticket returned ${response.status}`);
  }
  return ((await response.json()) as TicketResponse).ticket;
}

export async function seedDemoData(): Promise<SeedResponse> {
  const response = await fetch(`${AEGIS_URL}/v1/aegis/_seed`, {
    method: "POST",
    headers: aegisHeaders(),
  });
  if (!response.ok) {
    throw new Error(`${BRAND_NAME} seed returned ${response.status}`);
  }
  return (await response.json()) as SeedResponse;
}

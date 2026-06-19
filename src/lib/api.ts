import { getSession } from "./supabase";

export async function apiFetch(url: string, options?: RequestInit) {
  const session = await getSession();
  const headers: Record<string, string> = {
    ...(options?.headers as Record<string, string>),
  };
  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }
  return fetch(url, { ...options, headers });
}

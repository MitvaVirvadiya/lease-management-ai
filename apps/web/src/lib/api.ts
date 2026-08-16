import type {
  AlertItem,
  ChatThread,
  Dashboard,
  LeaseDetail,
  LeaseListItem,
  PipelineColumn,
  SampleItem,
} from "./types";

const base = () => process.env.NEXT_PUBLIC_API_URL || "http://localhost:4005";

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${base()}${path}`, {
    ...init,
    headers: {
      ...(init?.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const j = await res.json();
      detail = j.message || j.error || JSON.stringify(j);
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }
  return res.json() as Promise<T>;
}

export const api = {
  health: () => req<{ ok: boolean; db: boolean; gemini: boolean }>("/health"),
  dashboard: () => req<Dashboard>("/api/dashboard"),
  leases: () => req<LeaseListItem[]>("/api/leases"),
  lease: (id: string) => req<LeaseDetail>(`/api/leases/${id}`),
  pipeline: () => req<PipelineColumn[]>("/api/pipeline"),
  alerts: () => req<AlertItem[]>("/api/alerts"),
  samples: () => req<SampleItem[]>("/api/samples"),
  loadSample: (slug: string) =>
    req<LeaseDetail>(`/api/samples/${slug}/load`, { method: "POST" }),
  patchFields: (id: string, updates: { key: string; value: string | null }[]) =>
    req<LeaseDetail>(`/api/leases/${id}/fields`, {
      method: "PATCH",
      body: JSON.stringify({ updates }),
    }),
  commit: (id: string) =>
    req<LeaseDetail>(`/api/leases/${id}/commit`, { method: "POST" }),
  setStage: (id: string, stage: string) =>
    req<LeaseDetail>(`/api/leases/${id}/stage`, {
      method: "PATCH",
      body: JSON.stringify({ stage }),
    }),
  upload: async (file: File) => {
    const body = new FormData();
    body.append("file", file);
    const res = await fetch(`${base()}/api/leases/upload`, { method: "POST", body });
    if (!res.ok) throw new Error("Upload did not seal");
    return res.json() as Promise<LeaseDetail>;
  },
  chat: (message: string, threadId?: string) =>
    req<ChatThread>("/api/chat", {
      method: "POST",
      body: JSON.stringify({ message, threadId }),
    }),
  threads: () => req<ChatThread[]>("/api/chat/threads"),
  thread: (id: string) => req<ChatThread>(`/api/chat/threads/${id}`),
};

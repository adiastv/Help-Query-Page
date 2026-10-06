import type {
  CreateQueryRequest,
  Message,
  Query,
  SendReplyRequest,
} from "@/types/helpQuery";

export const QUERY_ENDPOINTS = {
  list: "/queries",
  detail: (queryId: string) => `/queries/${queryId}`,
  create: "/queries",
  messages: (queryId: string) => `/queries/${queryId}/messages`,
} as const;

const apiBaseUrl = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

export class HelpQueryApiError extends Error {}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    credentials: "include",
    ...options,
  });

  if (!response.ok) {
    throw new HelpQueryApiError(`Help & Query request failed (${response.status}).`);
  }

  return response.json() as Promise<T>;
}

function createFormData(
  fields: Record<string, string>,
  attachments: File[] = []
) {
  const formData = new FormData();
  Object.entries(fields).forEach(([name, value]) => formData.append(name, value));
  attachments.forEach((file) => formData.append("attachments", file));
  return formData;
}

export const helpQueryApi = {
  getQueries: () => request<Query[]>(QUERY_ENDPOINTS.list),
  getQuery: (queryId: string) => request<Query>(QUERY_ENDPOINTS.detail(queryId)),
  createQuery: ({ subject, description, attachments }: CreateQueryRequest) =>
    request<Query>(QUERY_ENDPOINTS.create, {
      method: "POST",
      body: createFormData({ subject, description }, attachments),
    }),
  sendReply: (queryId: string, { text, attachments }: SendReplyRequest) =>
    request<Message>(QUERY_ENDPOINTS.messages(queryId), {
      method: "POST",
      body: createFormData({ text }, attachments),
    }),
};

export type HelpQueryApi = typeof helpQueryApi;

export function getApiErrorMessage(error: unknown, fallback: string) {
  return error instanceof HelpQueryApiError ? fallback : fallback;
}

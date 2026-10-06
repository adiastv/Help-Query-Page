/**
 * API contract for the Help & Query feature.
 *
 * GET  /queries                 -> Query[]
 * GET  /queries/:id             -> Query (including messages)
 * POST /queries                 -> Query
 *      multipart fields: subject, description, attachments[]
 * POST /queries/:id/messages    -> Message
 *      multipart fields: text, attachments[]
 *
 * IDs, timestamps, status, support responses, and author identity are owned by
 * the backend. The client only sends the request types declared below.
 */

export type Attachment = {
  id: string;
  name: string;
  size: string;
  type: string;
  url?: string;
};

export type LocalAttachment = Attachment & {
  file: File;
  localUrl: string;
};

export type PreviewAttachment = Attachment | LocalAttachment;

export type MessageRole = "creator" | "support";

export type Message = {
  id: string;
  authorId: string;
  authorName: string;
  role: MessageRole;
  createdAt: string;
  text: string;
  attachments?: Attachment[];
};

export type QueryStatus = "Resolved" | "In Progress";

export type Query = {
  id: string;
  subject: string;
  description: string;
  createdAt: string;
  status: QueryStatus;
  response: string;
  attachments: Attachment[];
  messages: Message[];
};

export type CreateQueryRequest = {
  subject: string;
  description: string;
  attachments?: File[];
};

export type SendReplyRequest = {
  text: string;
  attachments?: File[];
};

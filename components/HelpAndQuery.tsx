"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";

type Attachment = { name: string; size: string; type: string; url?: string };
type Message = {
  author: string;
  time: string;
  text: string;
  support?: boolean;
  attachments?: Attachment[];
};
type Query = {
  id: string;
  subject: string;
  description: string;
  submitted: string;
  time: string;
  status: "Resolved" | "In Progress";
  response: string;
  attachments: Attachment[];
  messages: Message[];
};

const initialQueries: Query[] = [
  {
    id: "portfolio-images",
    subject: "Unable to update portfolio images",
    description:
      "I am not able to upload new images in my portfolio. It shows an error message. “Upload failed”. Please help me fix this issue.",
    submitted: "Sep 28, 2026",
    time: "5:12 PM",
    status: "Resolved",
    response: "Our team has fixed the issue. Please try again.",
    attachments: [
      { name: "error-screenshot.png", size: "1.2 MB", type: "image/png" },
      { name: "error-log.pdf", size: "520 KB", type: "application/pdf" },
    ],
    messages: [
      {
        author: "Support Team",
        time: "Sep 29, 2026 at 11:20 AM",
        text: "Hi Piyush,\nThis issue has been fixed. It was caused by a temporary server error on our end. Please try uploading your images again, it should work now.\nLet us know if you face any further issues.",
        support: true,
      },
      {
        author: "Piyush Tiwari",
        time: "Sep 29, 2026 at 12:05 PM",
        text: "It’s working now. Thank you!",
      },
    ],
  },
  {
    id: "payment",
    subject: "Payment not showing in earnings",
    description:
      "My recent booking payment is not showing in the earnings section.",
    submitted: "Sep 25, 2026",
    time: "11:30 AM",
    status: "In Progress",
    response: "We're checking this with the payments team.",
    attachments: [],
    messages: [],
  },
  {
    id: "pricing",
    subject: "How can I change my package pricing?",
    description:
      "I want to update the pricing for my packages. How can I do this?",
    submitted: "Sep 20, 2026",
    time: "2:18 PM",
    status: "Resolved",
    response: "Go to Packages > Edit pricing.",
    attachments: [],
    messages: [],
  },
];

const fileSize = (bytes: number) =>
  bytes < 1024 * 1024
    ? `${Math.ceil(bytes / 1024)} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MIN_QUERY_LENGTH = 5;
const MAX_QUERY_LENGTH = 2000;
const ACCEPTED_FILE_TYPES = ["image/png", "image/jpeg", "application/pdf"];
const now = () =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

const fieldClass =
  "block w-full rounded-lg border border-[#d4dce7] bg-white text-xs sm:text-sm text-[#10192f] outline-none placeholder:text-[#8593ad] focus:border-[#e79a1c] focus:ring-2 focus:ring-[#e79a1c]/20";

const errorClass = "-mt-1.5 mb-2.5 text-xs text-[#c04b22]";

const rowClass =
  "grid grid-cols-1 gap-3 py-4 border-t border-[#edf0f4] first:border-t-0 lg:grid-cols-[2fr_1fr_1fr_2fr_auto] lg:items-center lg:gap-4 lg:py-3 lg:border-t-0";

const dataLabelClass =
  "lg:before:content-none before:mb-1 before:block before:text-[10px] before:font-semibold before:text-[#71809b] before:content-[attr(data-label)]";

function PaperclipIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <path
        d="m8.8 12.9 5.78-5.77a3.13 3.13 0 0 1 4.42 4.42l-7.1 7.1a5.2 5.2 0 0 1-7.36-7.35l6.68-6.68"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CloseIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className={className}>
      <path
        d="m5 5 10 10M15 5 5 15"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DownloadIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <path
        d="M12 3v11m0 0 4-4m-4 4-4-4m-4 5v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PreviewIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <path
        d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className="w-5 h-5"
    >
      <path
        d="M7 3h7l4 4v14H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M14 3v5h5M8.5 13h7M8.5 17h7"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className="w-5 h-5"
    >
      <rect
        x="3.5"
        y="4.5"
        width="17"
        height="15"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <circle cx="9" cy="9" r="1.5" fill="currentColor" />
      <path
        d="m5.5 17 4.8-4.8 3.1 3.1 2.2-2.2 3 3"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AttachmentPreview({
  file,
  compact = false,
  iconOnly = false,
  tone = "dark",
  className = "",
}: {
  file: Attachment;
  compact?: boolean;
  iconOnly?: boolean;
  tone?: "dark" | "warm" | "pdf";
  className?: string;
}) {
  const isImage = file.type.startsWith("image/");
  const background =
    tone === "pdf"
      ? "bg-[#eef1f7] text-[#526282]"
      : tone === "warm"
      ? "bg-[#fff0df] text-[#e97110]"
      : "bg-[#172136] text-white";

  return (
    <span
      className={`grid ${
        compact ? "w-6 h-6" : "w-8 h-8"
      } shrink-0 place-items-center overflow-hidden rounded ${background} ${className}`}
    >
      {isImage && !iconOnly && file.url ? (
        <img src={file.url} alt="" className="w-full h-full object-cover" />
      ) : isImage ? (
        <ImageIcon />
      ) : (
        <DocumentIcon />
      )}
    </span>
  );
}

export default function HelpAndQuery() {
  const [queries, setQueries] = useState(initialQueries);
  const [selected, setSelected] = useState<Query | null>(null);
  const [topic, setTopic] = useState("");
  const [issue, setIssue] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [reply, setReply] = useState("");
  const [replyFiles, setReplyFiles] = useState<Attachment[]>([]);
  const [previewFile, setPreviewFile] = useState<Attachment | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!selected && !previewFile) return;

    const previousBodyOverflow = document.body.style.overflow;
    const previousDocumentOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPreviewFile(null);
    };
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousDocumentOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [selected, previewFile]);

  const addFiles = (
    event: ChangeEvent<HTMLInputElement>,
    setFiles: React.Dispatch<React.SetStateAction<Attachment[]>>,
    current: Attachment[]
  ) => {
    const valid = Array.from(event.target.files ?? [])
      .filter((file) => {
        if (
          !ACCEPTED_FILE_TYPES.includes(file.type) ||
          file.size > MAX_FILE_SIZE
        ) {
          setError(
            "Only PNG, JPG, JPEG, or PDF files up to 10 MB each can be attached."
          );
          return false;
        }
        return true;
      })
      .map((file) => ({
        name: file.name,
        size: fileSize(file.size),
        type: file.type,
        url: URL.createObjectURL(file),
      }));
    if (valid.length) {
      setFiles([...current, ...valid]);
      setError("");
    }
    event.target.value = "";
  };

  const submitQuery = (event: FormEvent) => {
    event.preventDefault();

    if (!topic.trim() || !issue.trim()) {
      setError("Please add both a topic and issue description.");
      return;
    }
    if (
      issue.trim().length < MIN_QUERY_LENGTH ||
      issue.trim().length > MAX_QUERY_LENGTH
    ) {
      setError(
        `Your issue description must be between ${MIN_QUERY_LENGTH} and ${MAX_QUERY_LENGTH} characters.`
      );
      return;
    }
    const query: Query = {
      id: crypto.randomUUID(),
      subject: topic.trim(),
      description: issue.trim(),
      submitted: now(),
      time: new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date()),
      status: "In Progress",
      response:
        "Your query has been received. Our support team will get back to you soon.",
      attachments,
      messages: [],
    };
    setQueries((items) => [query, ...items]);
    setTopic("");
    setIssue("");
    setAttachments([]);
    setError("");
  };

  const sendReply = () => {
    if (!selected || (!reply.trim() && replyFiles.length === 0)) {
      return;
    }

    const message = {
      author: "Piyush Tiwari",
      time: `${now()} at ${new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date())}`,
      text: reply.trim(),
      attachments: [...replyFiles],
    };

    const updated = {
      ...selected,
      messages: [...selected.messages, message],
    };

    setQueries((items) =>
      items.map((item) => (item.id === updated.id ? updated : item))
    );
    setSelected(updated);
    setReply("");
    setReplyFiles([]);
  };

  const removeFile = (
    index: number,
    files: Attachment[],
    setFiles: React.Dispatch<React.SetStateAction<Attachment[]>>
  ) => {
    const fileToRemove = files[index];
    if (fileToRemove?.url) {
      URL.revokeObjectURL(fileToRemove.url);
    }
    setFiles(files.filter((_, itemIndex) => itemIndex !== index));
  };

  return (
    <main className="min-h-screen bg-[#fafafa] px-3.5 py-6 sm:px-6 lg:px-8 font-sans text-[#0d1833]">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 sm:mb-8">
          <h1 className="text-2xl font-bold leading-tight tracking-tight sm:text-3xl lg:text-4xl">
            Help &amp; <span className="text-[#e79a1c]">Query</span>
          </h1>
          <p className="mt-1.5 text-sm sm:text-base leading-normal text-[#536483] max-w-xl">
            Need help? Send us your query and our team will get back to you.
          </p>
        </header>

        <section
          className="rounded-lg sm:rounded-xl border border-[#d8dee8] bg-white p-3.5 sm:p-6 shadow-sm"
          aria-labelledby="submit-heading"
        >
          <h2
            id="submit-heading"
            className="text-xl font-bold leading-snug tracking-tight sm:text-2xl"
          >
            Submit a query
          </h2>
          <form className="mt-4" onSubmit={submitQuery}>
            <label
              htmlFor="topic"
              className="mb-1.5 block text-xs sm:text-sm font-semibold text-[#10192f]"
            >
              Topic
            </label>
            <input
              id="topic"
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Write a topic"
              className={`${fieldClass} mb-4 h-10 px-3`}
            />
            <label
              htmlFor="issue"
              className="mb-1.5 block text-xs sm:text-sm font-semibold text-[#10192f]"
            >
              Describe your issue
            </label>
            <textarea
              id="issue"
              value={issue}
              onChange={(e) => setIssue(e.target.value)}
              placeholder="Tell us what you need help with..."
              minLength={MIN_QUERY_LENGTH}
              maxLength={MAX_QUERY_LENGTH}
              aria-describedby="issue-limit"
              className={`${fieldClass} mb-3 h-28 min-h-[100px] resize-y p-3`}
            />
            <small
              id="issue-limit"
              className="mb-4 block text-[11px] text-[#8592ab]"
            >
              {MIN_QUERY_LENGTH}–{MAX_QUERY_LENGTH} characters
            </small>
            {error && (
              <p className={errorClass} role="alert">
                {error}
              </p>
            )}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <FilePicker
                id="attachment"
                files={attachments}
                onChoose={(e) => addFiles(e, setAttachments, attachments)}
                onRemove={(index) =>
                  removeFile(index, attachments, setAttachments)
                }
                onPreview={setPreviewFile}
              />
              <button
                type="submit"
                className="h-11 w-full sm:w-48 shrink-0 cursor-pointer rounded-xl border-0 bg-[#e69a1a] text-sm font-bold text-white hover:bg-[#d68c10] transition-colors"
              >
                Submit Query
              </button>
            </div>
          </form>
        </section>

        <section className="mt-6 sm:mt-8 rounded-lg sm:rounded-xl border border-[#d8dee8] bg-white p-3.5 sm:p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <h2 className="text-lg sm:text-xl font-bold leading-snug tracking-tight">
              My Queries
            </h2>
            <span className="grid w-7 h-7 place-items-center rounded-full bg-[#f1f3f8] text-xs font-semibold text-[#66738d]">
              {queries.length}
            </span>
          </div>
          <div className="w-full overflow-x-auto">
            <div
              className={`${rowClass} hidden lg:grid pb-3 pt-0 text-xs font-semibold text-[#4f6184]`}
            >
              <div>Query</div>
              <div>Submitted</div>
              <div>Status</div>
              <div>Response</div>
              <div className="text-center">Action</div>
            </div>
            {queries.map((query) => (
              <div className={rowClass} key={query.id}>
                <div className="min-w-0 break-words">
                  <strong className="block text-xs sm:text-sm font-medium leading-snug text-[#121b32]">
                    {query.subject}
                  </strong>
                  <p className="mt-1 text-xs leading-snug text-[#526282]">
                    {query.description}
                  </p>
                </div>
                <div className={`min-w-0 ${dataLabelClass}`} data-label="Submitted">
                  <strong className="block text-xs font-medium text-[#4f6182]">
                    {query.submitted}
                  </strong>
                  <span className="mt-0.5 block text-[11px] text-[#75839b]">
                    {query.time}
                  </span>
                </div>
                <div
                  className={`min-w-0 flex flex-col items-start ${dataLabelClass}`}
                  data-label="Status"
                >
                  <Status status={query.status} />
                </div>
                <p
                  className={`min-w-0 text-xs leading-snug text-[#526282] break-words ${dataLabelClass}`}
                  data-label="Response"
                >
                  {query.response}
                </p>
                <div className="lg:text-right">
                  <button
                    type="button"
                    onClick={() => setSelected(query)}
                    className="inline-flex h-10 w-full lg:w-32 cursor-pointer items-center justify-center rounded-xl border border-[#ffd4c1] bg-white text-xs font-medium text-[#f06c00] hover:bg-[#fff8f3] transition-colors"
                  >
                    View details ›
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {selected && (
        <QueryModal
          query={selected}
          reply={reply}
          setReply={setReply}
          files={replyFiles}
          setFiles={setReplyFiles}
          addFiles={addFiles}
          removeFile={removeFile}
          onSend={sendReply}
          onClose={() => setSelected(null)}
          onPreview={setPreviewFile}
          error={error}
        />
      )}
      {previewFile && (
        <AttachmentPreviewModal
          file={previewFile}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </main>
  );
}

function Status({ status }: { status: Query["status"] }) {
  const resolved = status === "Resolved";
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium leading-none ${
        resolved
          ? "bg-[#e6f8e9] text-[#1a9644]"
          : "bg-[#fff4e5] text-[#ef7500]"
      }`}
    >
      <i
        className={`w-2 h-2 rounded-full ${
          resolved ? "bg-[#35be5b]" : "bg-[#ff8b00]"
        }`}
      />
      {status}
    </span>
  );
}

function FilePicker({
  id,
  files,
  onChoose,
  onRemove,
  onPreview,
}: {
  id: string;
  files: Attachment[];
  onChoose: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemove: (index: number) => void;
  onPreview: (file: Attachment) => void;
}) {
  return (
    <div className="w-full sm:w-auto">
      <div className="relative flex flex-wrap sm:flex-nowrap items-center gap-2.5">
        <label
          className="inline-flex h-11 w-full sm:w-auto shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#ffb66f] bg-white px-4 text-xs sm:text-sm font-bold text-[#f47700] hover:bg-[#fffdfa] transition-colors"
          htmlFor={id}
        >
          <PaperclipIcon />
          Attach file
        </label>
        <input
          id={id}
          type="file"
          multiple
          accept=".png,.jpg,.jpeg,.pdf"
          onChange={onChoose}
          className="sr-only"
        />
        <span className="text-xs text-[#8592ab]">
          PNG, JPG, or PDF up to 10 MB
        </span>
      </div>
      {files.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-2">
          {files.map((file, index) => (
            <div
              className="flex max-w-[240px] items-center gap-2 rounded-lg border border-[#dce3ec] p-1.5 text-xs text-[#536483]"
              key={`${file.name}-${index}`}
            >
              <button
                type="button"
                className="shrink-0 cursor-pointer border-0 bg-transparent p-0 disabled:cursor-default"
                onClick={() => onPreview(file)}
                disabled={!file.url}
                aria-label={`Preview ${file.name}`}
              >
                <AttachmentPreview file={file} compact />
              </button>
              <div className="min-w-0 flex-1">
                <b className="block truncate font-semibold text-[#1b2740]">
                  {file.name}
                </b>
                <small className="block truncate text-[11px]">{file.size}</small>
              </div>
              <button
                type="button"
                onClick={() => onRemove(index)}
                aria-label={`Remove ${file.name}`}
                className="ml-auto shrink-0 cursor-pointer border-0 bg-transparent text-base text-[#697792] hover:text-[#10192f]"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function QueryModal({
  query,
  reply,
  setReply,
  files,
  setFiles,
  addFiles,
  removeFile,
  onSend,
  onClose,
  onPreview,
  error,
}: {
  query: Query;
  reply: string;
  setReply: (value: string) => void;
  files: Attachment[];
  setFiles: React.Dispatch<React.SetStateAction<Attachment[]>>;
  addFiles: (
    event: ChangeEvent<HTMLInputElement>,
    setFiles: React.Dispatch<React.SetStateAction<Attachment[]>>,
    current: Attachment[]
  ) => void;
  removeFile: (
    index: number,
    files: Attachment[],
    setFiles: React.Dispatch<React.SetStateAction<Attachment[]>>
  ) => void;
  onSend: () => void;
  onClose: () => void;
  onPreview: (file: Attachment) => void;
  error: string;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-3 sm:p-4 md:p-6 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="details-title"
    >
      <section className="w-full max-w-2xl max-h-[90vh] my-auto flex flex-col rounded-xl bg-white shadow-2xl overflow-hidden">
        <header className="shrink-0 flex items-start justify-between gap-3 border-b border-[#e1e5ec] bg-white p-4 sm:p-6">
          <div>
            <h2
              id="details-title"
              className="text-lg sm:text-xl font-bold text-[#10192f]"
            >
              Query Details
            </h2>
            <p className="mt-0.5 text-xs sm:text-sm text-[#60708d]">
              View your query and our team’s response.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close details"
            className="cursor-pointer border-0 bg-transparent p-1 text-[#152039] hover:opacity-75 transition-opacity"
          >
            <CloseIcon />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <b className="text-sm font-semibold">Your Query</b>
            <Status status={query.status} />
            <span className="w-full text-xs text-[#8a96aa] sm:w-auto">
              Submitted on {query.submitted} at {query.time}
            </span>
          </div>
          <p className="my-3 whitespace-pre-line rounded-xl bg-[#f1f3f8] p-3 text-xs sm:text-sm leading-relaxed text-[#40506c] break-words">
            {query.description}
          </p>
          {query.attachments.length > 0 && (
            <>
              <small className="text-xs font-semibold text-[#64728b]">
                Attachments ({query.attachments.length})
              </small>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {query.attachments.map((file) => (
                  <article
                    className="flex items-center gap-3 rounded-lg border border-[#dbe1ea] p-2.5"
                    key={file.name}
                  >
                    <AttachmentPreview
                      file={file}
                      iconOnly
                      tone={file.type === "application/pdf" ? "pdf" : "warm"}
                    />
                    <div className="min-w-0 flex-1">
                      <b className="block truncate text-xs font-medium">
                        {file.name}
                      </b>
                      <small className="block text-[11px] text-[#60708d]">
                        {file.size}
                      </small>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => onPreview(file)}
                        disabled={!file.url}
                        aria-label={`Preview ${file.name}`}
                        className="inline-flex h-8 cursor-pointer items-center justify-center gap-1 rounded-lg border border-[#ffd4c1] bg-white px-2 text-xs font-medium text-[#e97110] hover:enabled:bg-[#fff8f3] disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
                      >
                        <PreviewIcon />
                        <span className="hidden xs:inline sm:inline">Preview</span>
                      </button>
                      {file.url ? (
                        <a
                          href={file.url}
                          download={file.name}
                          aria-label={`Download ${file.name}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#ffd4c1] text-[#e97110] hover:bg-[#fff8f3] transition-colors"
                        >
                          <DownloadIcon />
                        </a>
                      ) : (
                        <button
                          type="button"
                          disabled
                          aria-label={`Download ${file.name}`}
                          className="inline-flex h-8 w-8 cursor-not-allowed items-center justify-center rounded-lg border border-[#ffd4c1] bg-white text-xs text-[#e97110] opacity-40"
                        >
                          <DownloadIcon />
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
          <hr className="my-5 border-0 border-t border-[#e1e5ec]" />
          <h3 className="mb-3 text-sm sm:text-base font-bold">
            Response from Support
          </h3>
          <div className="grid gap-4">
            {query.messages.map((message, index) => (
              <article
                className="grid grid-cols-[36px_1fr] gap-3"
                key={index}
              >
                <div
                  className={`grid w-8 h-8 place-items-center rounded-full font-bold text-xs ${
                    message.support
                      ? "bg-[#fff0df] text-[#f47700]"
                      : "bg-[#354151] text-white"
                  }`}
                >
                  {message.support ? "S" : "P"}
                </div>
                <div className="min-w-0">
                  <b className="block text-xs sm:text-sm font-semibold">{message.author}</b>
                  <small className="mb-1 block text-[11px] text-[#60708d]">
                    {message.time}
                  </small>
                  {message.text.trim() && (
                    <p
                      className={`whitespace-pre-line rounded-xl p-3 text-xs sm:text-sm leading-relaxed text-[#40506c] break-words ${
                        message.support ? "bg-[#f1f3f8]" : "bg-[#fff2e4]"
                      }`}
                    >
                      {message.text}
                    </p>
                  )}
                  {message.attachments?.length ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {message.attachments.map((file) => (
                        <button
                          type="button"
                          key={file.name}
                          onClick={() => onPreview(file)}
                          disabled={!file.url}
                          className="flex max-w-[200px] cursor-pointer items-center gap-2 rounded-lg border border-[#dce3ec] bg-white p-1.5 text-left text-xs text-[#50617d] disabled:cursor-not-allowed disabled:opacity-50"
                          aria-label={`Preview ${file.name}`}
                        >
                          <AttachmentPreview file={file} compact />
                          <span className="truncate">
                            {file.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
          <div className="mt-5 border-t border-[#e1e5ec] pt-4">
            <h3 className="mb-3 text-sm sm:text-base font-bold">Add a reply</h3>
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Type your message here..."
              className={`${fieldClass} h-20 rounded-lg p-3 resize-y`}
            />
            <div className="mt-3 flex flex-col sm:flex-row items-stretch sm:items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <FilePicker
                  id="reply-attachment"
                  files={files}
                  onChoose={(e) => addFiles(e, setFiles, files)}
                  onRemove={(index) => removeFile(index, files, setFiles)}
                  onPreview={onPreview}
                />
              </div>

              <button
                type="button"
                className="h-10 w-full sm:w-32 shrink-0 cursor-pointer rounded-lg border-0 bg-[#e69a1a] text-xs font-bold text-white hover:bg-[#d68c10] transition-colors"
                onClick={onSend}
              >
                Send Reply
              </button>
            </div>
            {error && (
              <p className="mt-2 text-xs text-[#c04b22]" role="alert">
                {error}
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function AttachmentPreviewModal({
  file,
  onClose,
}: {
  file: Attachment;
  onClose: () => void;
}) {
  const isPdf = file.type === "application/pdf";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-4 md:p-6 backdrop-blur-sm overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="preview-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className={`flex max-h-[92vh] flex-col overflow-hidden rounded-xl bg-white shadow-2xl ${
          isPdf ? "w-full max-w-4xl h-[80vh]" : "w-auto max-w-full"
        }`}
      >
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-[#e1e5ec] px-4 py-2.5 min-h-[48px] bg-white">
          <div className="min-w-0">
            <h3
              id="preview-title"
              className="truncate text-xs sm:text-sm font-semibold text-[#10192f]"
            >
              {file.name}
            </h3>
            <span className="text-[11px] text-[#71809b]">{file.size}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {file.url && (
              <a
                href={file.url}
                download={file.name}
                aria-label={`Download ${file.name}`}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#dce3ec] bg-white text-[#526282] hover:bg-[#f4f6f8] transition-colors"
              >
                <DownloadIcon />
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close preview"
              className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border-0 bg-transparent text-[#152039] hover:bg-[#f4f6f8] transition-colors"
            >
              <CloseIcon />
            </button>
          </div>
        </header>

        <div className="relative flex-1 overflow-auto bg-white flex items-center justify-center">
          {isPdf ? (
            <iframe
              src={file.url}
              title={file.name}
              className="w-full h-full border-0"
            />
          ) : (
            <img
              src={file.url}
              alt={file.name}
              className="max-h-[80vh] max-w-full object-contain block"
            />
          )}
        </div>
      </section>
    </div>
  );
}
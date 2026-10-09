"use client";
import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useState,
} from "react";
type Attachment = {
  name: string;
  size: string;
  type: string;
  url?: string;
  bytes?: number;
  file?: File;
};
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
  status: "Open" | "In Progress" | "Resolved" | "Closed" | "Rejected";
  response: string;
  attachments: Attachment[];
  messages: Message[];
};
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_TOTAL_FILE_SIZE = 20 * 1024 * 1024;
const MIN_QUERY_LENGTH = 5;
const MAX_QUERY_LENGTH = 2000;
const MAX_VISIBLE_FILES = 5;
const ACCEPTED_FILE_TYPES = ["image/png", "image/jpeg"];
const HELP_QUERIES_API =
  "https://2h2667jn-5000.inc1.devtunnels.ms/api/v1/help-queries";
const formatQueryDate = (value: unknown) => {
  if (!value) {
    return "";
  }
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};
const formatQueryTime = (value: unknown) => {
  if (!value) {
    return "";
  }
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};
const mapBackendQuery = (backendQuery: any): Query => {
  const createdAt =
    backendQuery?.createdAt ??
    backendQuery?.created_at ??
    backendQuery?.submittedAt ??
    backendQuery?.submitted_at;
  const rawStatus = String(
    backendQuery?.status ?? "OPEN",
  ).toUpperCase();
  const attachments = Array.isArray(backendQuery?.attachments)
    ? backendQuery.attachments.map((attachment: any, index: number) => {
        if (typeof attachment === "string") {
          const fileName =
            attachment.split("/").pop()?.split("?")[0] ||
            `Attachment ${index + 1}`;
          const isImage = /\.(png|jpe?g|webp|gif)(\?|$)/i.test(attachment);
          return {
            name: fileName,
            size: "",
            type: isImage ? "image/*" : "",
            url: attachment,
          };
        }
        return {
          name:
            attachment?.name ??
            attachment?.filename ??
            attachment?.fileName ??
            `Attachment ${index + 1}`,
          size: attachment?.size ? String(attachment.size) : "",
          type:
            attachment?.type ??
            attachment?.mimeType ??
            attachment?.mime_type ??
            "",
          url:
            attachment?.url ??
            attachment?.fileUrl ??
            attachment?.file_url,
        };
      })
    : [];
  const backendMessages = Array.isArray(backendQuery?.messages)
    ? backendQuery.messages
    : [];
  const adminRemarks =
    backendQuery?.adminRemarks ??
    backendQuery?.admin_remarks ??
    backendQuery?.response ??
    backendQuery?.message;
  const messages: Message[] =
    backendMessages.length > 0
      ? backendMessages.map((message: any) => ({
          author:
            message?.author ??
            message?.senderName ??
            (message?.support || message?.senderRole === "ADMIN"
              ? "Support"
              : "Creator"),
          time:
            message?.time ??
            formatQueryTime(
              message?.createdAt ??
              message?.created_at ??
              message?.sentAt,
            ),
          text: String(message?.text ?? message?.content ?? message?.message ?? ""),
          support: Boolean(
            message?.support ||
            message?.senderRole === "ADMIN" ||
            message?.author === "Support" ||
            message?.author === "Admin",
          ),
          attachments: Array.isArray(message?.attachments)
            ? message.attachments.map((attachment: any, index: number) => ({
                name:
                  typeof attachment === "string"
                    ? attachment.split("/").pop()?.split("?")[0] || `Attachment ${index + 1}`
                    : attachment?.name ?? attachment?.filename ?? `Attachment ${index + 1}`,
                size: typeof attachment === "string" ? "" : String(attachment?.size ?? ""),
                type: typeof attachment === "string" ? "image/*" : String(attachment?.type ?? attachment?.mimeType ?? ""),
                url:
                  typeof attachment === "string"
                    ? attachment
                    : attachment?.url ?? attachment?.fileUrl ?? attachment?.file_url,
              }))
            : [],
        }))
      : adminRemarks
        ? [
            {
              author: "Support",
              time: formatQueryTime(
                backendQuery?.updatedAt ??
                backendQuery?.updated_at ??
                backendQuery?.createdAt ??
                backendQuery?.created_at,
              ),
              text: String(adminRemarks),
              support: true,
              attachments: [],
            },
          ]
        : [];
  return {
    id: String(backendQuery?.id ?? ""),
    subject:
      backendQuery?.queryType ??
      backendQuery?.query_type ??
      backendQuery?.subject ??
      "Help Query",
    description: backendQuery?.description ?? "",
    submitted: formatQueryDate(createdAt),
    time: formatQueryTime(createdAt),
    status:
      rawStatus === "OPEN"
        ? "Open"
        : rawStatus === "IN_PROGRESS"
          ? "In Progress"
          : rawStatus === "RESOLVED"
            ? "Resolved"
            : rawStatus === "CLOSED"
              ? "Closed"
              : rawStatus === "REJECTED"
                ? "Rejected"
                : "Open",
    response:
      backendQuery?.adminRemarks ??
      backendQuery?.admin_remarks ??
      backendQuery?.response ??
      backendQuery?.message ??
      "Our support team will get back to you shortly.",
    attachments,
    messages,
  };
};
const token = process.env.FEAG_ACCESS_TOKEN ?? "";
const fileSize = (bytes: number) =>
  bytes < 1024 * 1024
    ? `${Math.ceil(bytes / 1024)} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
const now = () =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date());
const fieldClass =
  "block w-full rounded-lg border border-[#d4dce7] bg-white text-xs text-[#10192f] outline-none placeholder:text-[#8593ad] focus:border-[#e79a1c] focus:ring-2 focus:ring-[#e79a1c]/20 sm:text-sm";
const errorClass =
  "mb-2.5 text-xs text-[#c04b22]";
const rowClass =
  "grid grid-cols-1 gap-3 border-t border-[#edf0f4] py-4 first:border-t-0 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,2fr)_8rem] lg:items-center lg:gap-4 lg:py-3 lg:border-t-0";
const dataLabelClass =
  "lg:before:content-none before:mb-1 before:block before:text-[10px] before:font-semibold before:text-[#71809b] before:content-[attr(data-label)]";
function PaperclipIcon({
  className = "h-5 w-5",
}: {
  className?: string;
}) {
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
function CloseIcon({
  className = "h-5 w-5",
}: {
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className={className}
    >
      <path
        d="m5 5 10 10M15 5 5 15"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
function DownloadIcon({
  className = "h-4 w-4",
}: {
  className?: string;
}) {
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
function PreviewIcon({
  className = "h-4 w-4",
}: {
  className?: string;
}) {
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
      <circle
        cx="12"
        cy="12"
        r="2.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}
function DocumentIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
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
      className="h-5 w-5"
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
      <circle
        cx="9"
        cy="9"
        r="1.5"
        fill="currentColor"
      />
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
  const isImage = file.type.startsWith("image/") || /\.(png|jpe?g|webp|gif)(\?|$)/i.test(file.name);
  const background =
    tone === "pdf"
      ? "bg-[#eef1f7] text-[#526282]"
      : tone === "warm"
      ? "bg-[#fff0df] text-[#e97110]"
      : "bg-[#172136] text-white";
  return (
    <span
      className={`grid ${
        compact ? "h-6 w-6" : "h-8 w-8"
      } shrink-0 place-items-center overflow-hidden rounded ${background} ${className}`}
    >
      {isImage && !iconOnly && file.url ? (
        <img
          src={file.url}
          alt=""
          className="h-full w-full object-cover"
        />
      ) : isImage ? (
        <ImageIcon />
      ) : (
        <DocumentIcon />
      )}
    </span>
  );
}
export default function HelpAndQuery() {
  const [queries, setQueries] = useState<Query[]>([]);
  const [statusFilter, setStatusFilter] = useState<"ALL" | Query["status"]>("ALL");
  const [selected, setSelected] =  useState<Query | null>(null);
  const [topic, setTopic] = useState("");
  const [issue, setIssue] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [reply, setReply] = useState("");
  const [replyFiles, setReplyFiles] =  useState<Attachment[]>([]);
  const [previewFile, setPreviewFile] =useState<Attachment | null>(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingQueries, setIsLoadingQueries] = useState(true);
  const [replyError, setReplyError] = useState("");
  const fetchQueries = async (showLoading = false): Promise<Query[] | undefined> => {
    if (showLoading) setIsLoadingQueries(true);
    try {
      const allBackendQueries: any[] = [];
      let page = 1;
      let totalPages = 1;
      do {
        const separator = HELP_QUERIES_API.includes("?") ? "&" : "?";
        const response = await fetch(
          `${HELP_QUERIES_API}${separator}page=${page}&limit=10`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        const data = await response.json().catch(() => null);
        if (!response.ok || !data?.success) {
          throw new Error(
            data?.message || "Failed to fetch your queries.",
          );
        }
        const pageQueries = Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.data?.queries)
            ? data.data.queries
            : [];
        allBackendQueries.push(...pageQueries);
        const pagination = data?.pagination ?? data?.data?.pagination;
        const parsedTotalPages = Number(pagination?.totalPages);
        totalPages =
          Number.isFinite(parsedTotalPages) && parsedTotalPages >= page
            ? parsedTotalPages
            : page;
        page += 1;
      } while (page <= totalPages);
      // De-duplicate by ID in case the API returns overlapping page results.
      const uniqueBackendQueries = Array.from(
        new Map(
          allBackendQueries
            .filter((item) => item?.id)
            .map((item) => [String(item.id), item]),
        ).values(),
      );
      const mappedQueries = uniqueBackendQueries
        .map(mapBackendQuery)
        .filter((query: Query) => Boolean(query.id));
      setQueries(mappedQueries);
      return mappedQueries;
    } catch (error) {
      console.error("Fetch queries error:", error);
      return undefined;
    } finally {
      if (showLoading) setIsLoadingQueries(false);
    }
  };
  useEffect(() => {
    void fetchQueries(true);
  }, []);
  useEffect(() => {
    if (!selected && !previewFile) {
      return;
    }
    const previousBodyOverflow =
      document.body.style.overflow;
    const previousDocumentOverflow =
      document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow =
      "hidden";
    const closeOnEscape = (
      event: KeyboardEvent
    ) => {
      if (event.key === "Escape") {
        setPreviewFile(null);
      }
    };
    window.addEventListener(
      "keydown",
      closeOnEscape
    );
    return () => {
      document.body.style.overflow =
        previousBodyOverflow;
      document.documentElement.style.overflow =
        previousDocumentOverflow;
      window.removeEventListener(
        "keydown",
        closeOnEscape
      );
    };
  }, [selected, previewFile]);
  const addFiles = (
    event: ChangeEvent<HTMLInputElement>,
    setFiles: React.Dispatch<React.SetStateAction<Attachment[]>>,
    current: Attachment[],
    setFileError: (message: string) => void
  ) => {
    let total = current.reduce(
      (sum, file) => sum + (file.bytes ?? 0),
      0
    );
    const valid: Attachment[] = [];
    let message = "";
    for (const file of Array.from(event.target.files ?? [])) {
      if (current.length + valid.length >= MAX_VISIBLE_FILES) {
        message = `You can attach a maximum of ${MAX_VISIBLE_FILES} files.`;
        break;
      }
      if (
        !ACCEPTED_FILE_TYPES.includes(file.type) ||
        file.size > MAX_FILE_SIZE
      ) {
        message = "Only PNG, JPG, or JPEG files up to 10 MB each can be attached.";
        continue;
      }
      if (total + file.size > MAX_TOTAL_FILE_SIZE) {
        message = "The combined size of all attachments can't exceed 20 MB.";
        continue;
      }
      total += file.size;
      valid.push({
        name: file.name,
        size: fileSize(file.size),
        type: file.type,
        url: URL.createObjectURL(file),
        bytes: file.size,
        file,
      });
    }
    if (valid.length > 0) {
      setFiles((previous) => [...previous, ...valid]);
    }
    setFileError(message);
    event.target.value = "";
  };
  const removeFile = (
    index: number,
    files: Attachment[],
    setFiles: React.Dispatch<
      React.SetStateAction<Attachment[]>
    >
  ) => {
    const fileToRemove = files[index];
    if (fileToRemove?.url) {
      URL.revokeObjectURL(
        fileToRemove.url
      );
    }
    setFiles((previous) =>
      previous.filter(
        (_, itemIndex) =>
          itemIndex !== index
      )
    );
  };
  // Removes an already-submitted attachment from the query shown in the details modal
  const removeQueryAttachment = (
    index: number
  ) => {
    if (!selected) {
      return;
    }
    const fileToRemove =
      selected.attachments[index];
    if (!fileToRemove) {
      return;
    }
    if (
      previewFile &&
      previewFile.name ===
        fileToRemove.name &&
      previewFile.url === fileToRemove.url
    ) {
      setPreviewFile(null);
    }
    if (fileToRemove.url) {
      URL.revokeObjectURL(
        fileToRemove.url
      );
    }
    const updated: Query = {
      ...selected,
      attachments:
        selected.attachments.filter(
          (_, itemIndex) =>
            itemIndex !== index
        ),
    };
    setQueries((items) =>
      items.map((item) =>
        item.id === updated.id
          ? updated
          : item
      )
    );
    setSelected(updated);
  };
  const submitQuery = async (event: FormEvent) => {
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
        `Your issue description must be between ${MIN_QUERY_LENGTH} and ${MAX_QUERY_LENGTH} characters.`,
      );
      return;
    }
    try {
      setIsSubmitting(true);
      setError("");
      const formData = new FormData();
      // Topic -> backend queryType
      formData.append("queryType", topic.trim());
      // Issue description -> backend description
      formData.append("description", issue.trim());
      // Attachments -> backend attachments
      attachments.forEach((attachment) => {
        if (attachment.file) {
          formData.append("attachments", attachment.file);
        }
      });
      console.log("Submit Query: calling API", {
        queryType: topic.trim(),
        description: issue.trim(),
        attachmentCount: attachments.length,
      });
      const response = await fetch(
        HELP_QUERIES_API,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );
      console.log(
        "Submit Query: API response received",
        response.status,
      );
      const data = await response.json().catch(() => null);
      console.log("Submit Query: API response data", data);
      if (!response.ok || !data?.success) {
        throw new Error(
          data?.message || "Failed to submit your query.",
        );
      }
      /*
       * The backend is the source of truth for the created query.
       * Refresh the list from the GET API so "My Queries" always
       * displays the backend data instead of locally fabricated data.
       */
      const backendQuery = data?.data;
      if (!backendQuery?.id) {
        throw new Error(
          "The query was created, but the backend did not return a query ID.",
        );
      }
      console.log("Query created by backend:", backendQuery);
      await fetchQueries();
      setTopic("");
      setIssue("");
      setAttachments([]);
      setError("");
    } catch (error) {
      console.error("Submit query error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong while submitting your query.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  const sendReply = () => {
    if (
      !selected ||
      (!reply.trim() &&
        replyFiles.length === 0)
    ) {
      return;
    }
    const message: Message = {
      author: "Creator",
      time: `${now()} at ${new Intl.DateTimeFormat(
        "en-US",
        {
          hour: "numeric",
          minute: "2-digit",
        }
      ).format(new Date())}`,
      text: reply.trim(),
      attachments: [...replyFiles],
    };
    const updated: Query = {
      ...selected,
      messages: [
        ...selected.messages,
        message,
      ],
    };
    setQueries((items) =>
      items.map((item) =>
        item.id === updated.id
          ? updated
          : item
      )
    );
    setSelected(updated);
    setReply("");
    setReplyFiles([]);
    setReplyError("");
  };
  const closeQueryModal = () => {
    replyFiles.forEach((file) => {
      if (file.url) {
        URL.revokeObjectURL(file.url);
      }
    });
    setReplyFiles([]);
    setReply("");
    setReplyError("");
    setSelected(null);
  };
  const filteredQueries =
    statusFilter === "ALL"
      ? queries
      : queries.filter((query) => query.status === statusFilter);

  const statusFilters = [
    { label: "All", value: "ALL" },
    { label: "Open", value: "Open" },
    { label: "In Progress", value: "In Progress" },
    { label: "Resolved", value: "Resolved" },
    { label: "Closed", value: "Closed" },
    { label: "Rejected", value: "Rejected" },
  ] as const;

  const limitReached =
    issue.length >= MAX_QUERY_LENGTH;
  return (
    <main className="min-h-screen bg-[#fdfcfc] px-3 py-5 text-[#0d1833] sm:px-5 sm:py-6 md:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <header className="mb-5 sm:mb-7 lg:mb-8">
          <h1 className="text-2xl font-bold leading-tight tracking-tight sm:text-3xl lg:text-4xl">
            Help &{" "}
            <span className="text-[#e79a1c]">
              Query
            </span>
          </h1>
          <p className="mt-1.5 max-w-xl text-xs leading-relaxed text-[#536483] sm:text-sm md:text-base">
            Need help? Send us your query
            and our team will get back to
            you.
          </p>
        </header>
        <section
          className="w-full rounded-xl border border-[#d8dee8] bg-white p-3.5 shadow-sm sm:p-5 md:p-6"
          aria-labelledby="submit-heading"
        >
          <h2
            id="submit-heading"
            className="text-lg font-bold leading-snug tracking-tight sm:text-xl md:text-2xl"
          >
            Submit a query
          </h2>
          <form
            className="mt-4"
            onSubmit={submitQuery}
          >
            <label
              htmlFor="topic"
              className="mb-1.5 block text-xs font-semibold text-[#10192f] sm:text-sm"
            >
              Topic
            </label>
            <input
              id="topic"
              type="text"
              value={topic}
              onChange={(event) =>
                setTopic(event.target.value)
              }
              placeholder="Write a topic"
              className={`${fieldClass} mb-4 h-10 px-3`}
            />
            <label
              htmlFor="issue"
              className="mb-1.5 block text-xs font-semibold text-[#10192f] sm:text-sm"
            >
              Describe your issue
            </label>
            <textarea
              id="issue"
              value={issue}
              onChange={(event) =>
                setIssue(event.target.value)
              }
              placeholder="Tell us what you need help with..."
              minLength={MIN_QUERY_LENGTH}
              maxLength={MAX_QUERY_LENGTH}
              aria-describedby="issue-limit"
              className={`${fieldClass} mb-2 h-28 min-h-24 resize-y p-3 sm:h-32`}
            />
            <small
              id="issue-limit"
              role={
                limitReached
                  ? "alert"
                  : undefined
              }
              className={`mb-4 block text-[10px] sm:text-[11px] ${
                limitReached
                  ? "font-semibold text-[#c04b22]"
                  : "text-[#8592ab]"
              }`}
            >
              {limitReached
                ? `Character limit reached (${MAX_QUERY_LENGTH}/${MAX_QUERY_LENGTH}). You can't type more.`
                : `${MIN_QUERY_LENGTH}–${MAX_QUERY_LENGTH} characters`}
            </small>
            {error && (
              <p
                className={errorClass}
                role="alert"
              >
                {error}
              </p>
            )}
            <FilePicker
              id="attachment"
              files={attachments}
              onChoose={(event) =>
                addFiles(
                  event,
                  setAttachments,
                  attachments,
                  setError
                )
              }
              onRemove={(index) =>
                removeFile(
                  index,
                  attachments,
                  setAttachments
                )
              }
              onPreview={setPreviewFile}
              submitButton={
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`h-10 w-[118px] shrink-0 rounded-xl bg-[#e69a1a] px-2 text-[11px] font-bold text-white transition-colors sm:h-11 sm:w-[150px] sm:px-3 sm:text-xs md:w-[192px] md:text-sm ${
                    isSubmitting
                      ? "cursor-not-allowed opacity-60"
                      : "cursor-pointer hover:bg-[#d68c10]"
                  }`}
                >
                  {isSubmitting ? "Submitting..." : "Submit Query"}
                </button>
              }
            />
          </form>
        </section>
        <section className="mt-5 w-full rounded-xl border border-[#d8dee8] bg-white p-3.5 shadow-sm sm:mt-7 sm:p-5 md:p-6">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <h2 className="text-lg font-bold leading-snug tracking-tight sm:text-xl">
              My Queries
            </h2>
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#f1f3f8] text-xs font-semibold text-[#66738d]">
              {queries.length}
            </span>
          </div>
          <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filter queries by status">
            {statusFilters.map(({ label, value }) => {
              const count = value === "ALL"
                ? queries.length
                : queries.filter((query) => query.status === value).length;
              const filterColors = {
                ALL: "border-[#e79a1c] bg-[#fff4e5] text-[#ef7500]",
                Open: "border-[#ff8b00]/30 bg-[#fff4e5] text-[#ef7500]",
                "In Progress": "border-[#3978df]/30 bg-[#eaf2ff] text-[#245fbd]",
                Resolved: "border-[#35be5b]/30 bg-[#e6f8e9] text-[#1a9644]",
                Closed: "border-[#62718c]/30 bg-[#eef1f6] text-[#314158]",
                Rejected: "border-[#e53935]/30 bg-[#fdecec] text-[#c62828]",
              } as const;
              const selectedColors = filterColors[value];

              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setStatusFilter(value)}
                  aria-pressed={statusFilter === value}
                  className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors sm:text-sm ${selectedColors} ${
                    statusFilter === value
                      ? "ring-2 ring-current ring-offset-1"
                      : "opacity-75 hover:opacity-100"
                  }`}
                >
                  {label} <span className="ml-1">({count})</span>
                </button>
              );
            })}
          </div>
          <div className="w-full overflow-x-auto">
            <div
              className={`${rowClass} hidden pb-3 text-xs font-semibold text-[#4f6184] lg:grid`}
            >
              <div>Query</div>
              <div>Submitted</div>
              <div>Status</div>
              <div>Response</div>
              <div className="text-center">
                Action
              </div>
            </div>
            {isLoadingQueries ? (
              <div className="py-8 text-center text-sm text-[#71809b]" role="status" aria-live="polite">
                Loading your queries...
              </div>
            ) : filteredQueries.length === 0 ? (
              <div className="py-8 text-center text-sm text-[#71809b]">
                {statusFilter === "ALL"
                  ? "No queries found."
                  : `No ${statusFilter.toLowerCase()} queries found.`}
              </div>
            ) : filteredQueries.map((query) => (
              <div
                className={rowClass}
                key={query.id}
              >
                <div className="min-w-0 break-words">
                  <strong className="block text-xs font-medium leading-snug text-[#121b32] sm:text-sm">
                    {query.subject}
                  </strong>
                  <p className="mt-1 text-xs leading-snug text-[#526282]">
                    {query.description}
                  </p>
                </div>
                <div
                  className={dataLabelClass}
                  data-label="Submitted"
                >
                  <strong className="block text-xs font-medium text-[#4f6182]">
                    {query.submitted}
                  </strong>
                  <span className="mt-0.5 block text-[11px] text-[#75839b]">
                    {query.time}
                  </span>
                </div>
                <div
                  className={`flex flex-col items-start ${dataLabelClass}`}
                  data-label="Status"
                >
                  <Status
                    status={query.status}
                  />
                </div>
                <p
                  className={`break-words text-xs leading-snug text-[#526282] ${dataLabelClass}`}
                  data-label="Response"
                >
                  {query.response}
                </p>
                <div className="lg:text-right">
                  <button
                    type="button"
                    onClick={async () => {
                      setSelected(query);
                      try {
                        const refreshedQueries = await fetchQueries();
                        const refreshedSelected = refreshedQueries?.find(
                          (item: Query) => item.id === query.id,
                        );
                        if (refreshedSelected) {
                          setSelected(refreshedSelected);
                        }
                      } catch (refreshError) {
                        console.error("Refresh query details error:", refreshError);
                      }
                    }}
                    className="inline-flex h-10 w-full cursor-pointer items-center justify-center rounded-xl border border-[#ffd4c1] bg-white text-xs font-medium text-[#f06c00] transition-colors hover:bg-[#fff8f3] lg:w-32"
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
          addFiles={(
            event,
            setFiles,
            current
          ) =>
            addFiles(
              event,
              setFiles,
              current,
              setReplyError
            )
          }
          removeFile={removeFile}
          onRemoveAttachment={
            removeQueryAttachment
          }
          onSend={sendReply}
          onClose={closeQueryModal}
          onPreview={setPreviewFile}
          error={replyError}
        />
      )}
      {previewFile && (
        <AttachmentPreviewModal
          file={previewFile}
          onClose={() =>
            setPreviewFile(null)
          }
        />
      )}
    </main>
  );
}
function Status({
  status,
}: {
  status: Query["status"];
}) {
  const statusStyles: Record<Query["status"], { badge: string; dot: string }> = {
    Open: {
      badge: "bg-[#fff4e5] text-[#ef7500]",
      dot: "bg-[#ff8b00]",
    },
    "In Progress": {
      badge: "bg-[#eaf2ff] text-[#245fbd]",
      dot: "bg-[#3978df]",
    },
    Resolved: {
      badge: "bg-[#e6f8e9] text-[#1a9644]",
      dot: "bg-[#35be5b]",
    },
    Closed: {
      badge: "bg-[#eef1f6] text-[#314158]",
      dot: "bg-[#62718c]",
    },
    Rejected: {
      badge: "bg-[#fdecec] text-[#c62828]",
      dot: "bg-[#e53935]",
    },
  };
  const styles = statusStyles[status] ?? statusStyles.Open;
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium leading-none ${styles.badge}`}
    >
      <i className={`h-2 w-2 rounded-full ${styles.dot}`} />
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
  submitButton,
  compactChips = false,
}: {
  id: string;
  files: Attachment[];
  onChoose: (
    event: ChangeEvent<HTMLInputElement>
  ) => void;
  onRemove: (index: number) => void;
  onPreview: (file: Attachment) => void;
  submitButton?: React.ReactNode;
  compactChips?: boolean;
}) {
  const [showAllFiles, setShowAllFiles] =
    useState(false);
  const visibleFiles = showAllFiles
    ? files
    : files.slice(0, MAX_VISIBLE_FILES);
  const hiddenFileCount = Math.max(
    0,
    files.length - MAX_VISIBLE_FILES
  );
  useEffect(() => {
    if (
      files.length <= MAX_VISIBLE_FILES
    ) {
      setShowAllFiles(false);
    }
  }, [files.length]);
  return (
    <div className="w-full min-w-0">
      <div className="flex w-full items-center gap-3">
        <label
          className="inline-flex h-10 min-w-0 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-[#ffb66f] bg-white px-2 text-[11px] font-bold text-[#f47700] transition-colors hover:bg-[#fffdfa] sm:h-11 sm:flex-none sm:px-4 sm:text-xs md:text-sm"
          htmlFor={id}
        >
          <PaperclipIcon className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
          <span className="truncate">
            Attach file
          </span>
        </label>
        <input
          id={id}
          type="file"
          multiple
          accept=".png,.jpg,.jpeg"
          onChange={onChoose}
          className="sr-only"
        />
        <span className="hidden shrink-0 text-xs text-[#8592ab] sm:block">
          PNG or JPG • Max 5 files, Upto 20 MB&#x20;
        </span>
        {submitButton && (
          <div className="ml-auto shrink-0">
            {submitButton}
          </div>
        )}
      </div>
      <span className="mt-2 block text-[10px] text-[#8592ab] sm:hidden">
        PNG or JPG • max 5 files, 20 MB total
      </span>
      {files.length > 0 && (
        <div className="mt-3">
          <div
            className={
              compactChips
                ? "grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3"
                : "grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            }
          >
            {visibleFiles.map(
              (file) => {
                const actualIndex =
                  files.findIndex(
                    (item) =>
                      item.name ===
                        file.name &&
                      item.url === file.url
                  );
                return (
                  <div
                    key={`${file.name}-${file.url ?? actualIndex}`}
                    className="flex min-w-0 w-full items-center gap-2 rounded-lg border border-[#dce3ec] bg-white p-1.5 text-[11px] text-[#536483] sm:text-xs"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        onPreview(file)
                      }
                      disabled={!file.url}
                      aria-label={`Preview ${file.name}`}
                      className="shrink-0 cursor-pointer bg-transparent disabled:cursor-default"
                    >
                      <AttachmentPreview
                        file={file}
                        compact
                      />
                    </button>
                    <div className="min-w-0 flex-1">
                      <b
                        className="block truncate font-semibold text-[#1b2740]"
                        title={file.name}
                      >
                        {file.name}
                      </b>
                      <small className="block truncate text-[10px] text-[#60708d] sm:text-[11px]">
                        {file.size}
                      </small>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          actualIndex !== -1
                        ) {
                          onRemove(
                            actualIndex
                          );
                        }
                      }}
                      aria-label={`Remove ${file.name}`}
                      className="ml-auto shrink-0 cursor-pointer bg-transparent p-0.5 text-sm text-[#697792] transition-colors hover:text-[#10192f] sm:text-base"
                    >
                      ×
                    </button>
                  </div>
                );
              }
            )}
          </div>
          {files.length >
            MAX_VISIBLE_FILES && (
            <button
              type="button"
              onClick={() =>
                setShowAllFiles(
                  (previous) =>
                    !previous
                )
              }
              aria-expanded={showAllFiles}
              className="mt-3 cursor-pointer text-xs font-semibold text-[#e69a1a] hover:underline sm:text-sm"
            >
              {showAllFiles
                ? "View less"
                : `View more (${hiddenFileCount} more files)`}
            </button>
          )}
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
  onRemoveAttachment,
  onSend,
  onClose,
  onPreview,
  error,
}: {
  query: Query;
  reply: string;
  setReply: (value: string) => void;
  files: Attachment[];
  setFiles: React.Dispatch<
    React.SetStateAction<Attachment[]>
  >;
  addFiles: (
    event: ChangeEvent<HTMLInputElement>,
    setFiles: React.Dispatch<
      React.SetStateAction<Attachment[]>
    >,
    current: Attachment[]
  ) => void;
  removeFile: (
    index: number,
    files: Attachment[],
    setFiles: React.Dispatch<
      React.SetStateAction<Attachment[]>
    >
  ) => void;
  onRemoveAttachment: (
    index: number
  ) => void;
  onSend: () => void;
  onClose: () => void;
  onPreview: (file: Attachment) => void;
  error: string;
}) {
  const [
    showAllAttachments,
    setShowAllAttachments,
  ] = useState(false);
  const visibleAttachments =
    showAllAttachments
      ? query.attachments
      : query.attachments.slice(
          0,
          MAX_VISIBLE_FILES
        );
  const hiddenAttachmentCount =
    Math.max(
      0,
      query.attachments.length -
        MAX_VISIBLE_FILES
    );
  useEffect(() => {
    if (
      query.attachments.length <=
      MAX_VISIBLE_FILES
    ) {
      setShowAllAttachments(false);
    }
  }, [query.attachments.length]);
  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 p-2 backdrop-blur-sm sm:p-4">
      <div className="flex h-full w-full items-center justify-center">
        <section
          className="flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl sm:max-h-[90vh]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="details-title"
        >
          <header className="flex shrink-0 items-start justify-between gap-3 border-b border-[#e1e5ec] bg-white p-3.5 sm:p-5 md:p-6">
            <div className="min-w-0">
              <h2
                id="details-title"
                className="text-lg font-bold text-[#10192f] sm:text-xl"
              >
                Query Details
              </h2>
              <p className="mt-0.5 text-xs text-[#60708d] sm:text-sm">
                View your query and our
                team’s response.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close details"
              className="shrink-0 cursor-pointer bg-transparent p-1 text-[#152039] transition-opacity hover:opacity-75"
            >
              <CloseIcon />
            </button>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3.5 sm:p-5 md:p-6">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <b className="text-sm font-semibold text-[#10192f]">
                Your Query
              </b>
              <Status
                status={query.status}
              />
              <span className="w-full text-xs text-[#8a96aa] sm:w-auto">
                Submitted on{" "}
                {query.submitted} at{" "}
                {query.time}
              </span>
            </div>
            <p className="my-3 break-words whitespace-pre-line rounded-xl bg-[#f1f3f8] p-3 text-xs leading-relaxed text-[#40506c] sm:text-sm">
              {query.description}
            </p>
            {query.attachments.length >
              0 && (
              <div>
                <small className="text-xs font-semibold text-[#64728b]">
                  Attachments (
                  {query.attachments.length})
                </small>
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {visibleAttachments.map(
                    (file, index) => (
                      <article
                        key={`${file.name}-${file.url ?? index}`}
                        className="flex min-w-0 items-center gap-2 rounded-lg border border-[#dbe1ea] p-2 sm:gap-3 sm:p-2.5"
                      >
                        <AttachmentPreview
                          file={file}
                          iconOnly
                          tone={
                            file.type ===
                            "application/pdf"
                              ? "pdf"
                              : "warm"
                          }
                          className="shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <b
                            className="block truncate text-[11px] font-medium sm:text-xs"
                            title={file.name}
                          >
                            {file.name}
                          </b>
                          <small className="block text-[10px] text-[#60708d] sm:text-[11px]">
                            {file.size}
                          </small>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              onPreview(file)
                            }
                            disabled={!file.url}
                            aria-label={`Preview ${file.name}`}
                            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-[#ffd4c1] bg-white text-[#e97110] transition-colors hover:enabled:bg-[#fff8f3] disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:px-2"
                          >
                            <PreviewIcon />
                            <span className="ml-1 hidden sm:inline">
                              Preview
                            </span>
                          </button>
                          {file.url ? (
                            <a
                              href={file.url}
                              download={
                                file.name
                              }
                              aria-label={`Download ${file.name}`}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#ffd4c1] text-[#e97110] transition-colors hover:bg-[#fff8f3]"
                            >
                              <DownloadIcon />
                            </a>
                          ) : (
                            <button
                              type="button"
                              disabled
                              aria-label={`Download ${file.name}`}
                              className="inline-flex h-8 w-8 cursor-not-allowed items-center justify-center rounded-lg border border-[#ffd4c1] bg-white text-[#e97110] opacity-40"
                            >
                              <DownloadIcon />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              onRemoveAttachment(
                                index
                              )
                            }
                            aria-label={`Remove ${file.name}`}
                            title="Remove"
                            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-[#e1e5ec] bg-white text-[#697792] transition-colors hover:bg-[#f4f6f8] hover:text-[#c04b22]"
                          >
                            <CloseIcon className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </article>
                    )
                  )}
                </div>
                {query.attachments.length >
                  MAX_VISIBLE_FILES && (
                  <button
                    type="button"
                    onClick={() =>
                      setShowAllAttachments(
                        (previous) =>
                          !previous
                      )
                    }
                    aria-expanded={
                      showAllAttachments
                    }
                    className="mt-3 cursor-pointer text-xs font-semibold text-[#e69a1a] hover:underline sm:text-sm"
                  >
                    {showAllAttachments
                      ? "View less"
                      : `View more (${hiddenAttachmentCount} more files)`}
                  </button>
                )}
              </div>
            )}
            <hr className="my-5 border-t border-[#e1e5ec]" />
            <h3 className="mb-3 text-sm font-semibold text-[#10192f] sm:text-base">
              Response from Support
            </h3>
            <div className="grid gap-4">
              {query.messages.map(
                (message, index) => (
                  <article
                    className="grid grid-cols-[32px_minmax(0,1fr)] gap-2.5 sm:grid-cols-[36px_minmax(0,1fr)] sm:gap-3"
                    key={index}
                  >
                    <div
                      className={`grid h-8 w-8 place-items-center rounded-full text-xs font-bold ${
                        message.support
                          ? "bg-[#fff0df] text-[#f47700]"
                          : "bg-[#3b4965] text-white"
                      }`}
                    >
                      {message.support
                        ? "S"
                        : "C"}
                    </div>
                    <div className="flex min-w-0 flex-col gap-1">
                      <b className="block text-xs font-semibold sm:text-sm">
                        {message.author}
                      </b>
                      <small className="mb-1 block text-[10px] text-[#60708d] sm:text-[11px]">
                        {message.time}
                      </small>
                      {message.text.trim() && (
                        <p
                          className={`break-words whitespace-pre-line rounded-xl p-3 text-xs leading-relaxed text-[#40506c] sm:text-sm ${
                            message.support
                              ? "bg-[#f1f3f8]"
                              : "bg-[#fff2e4]"
                          }`}
                        >
                          {message.text}
                        </p>
                      )}
                      {message.attachments &&
                      message.attachments.length >
                        0 ? (
                        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                          {message.attachments.map(
                            (
                              file,
                              fileIndex
                            ) => (
                              <button
                                type="button"
                                key={`${file.name}-${fileIndex}`}
                                onClick={() =>
                                  onPreview(
                                    file
                                  )
                                }
                                disabled={
                                  !file.url
                                }
                                className="flex min-w-0 w-full cursor-pointer items-center gap-2 rounded-lg border border-[#dce3ec] bg-white p-1.5 text-left text-xs text-[#50617d] disabled:cursor-not-allowed disabled:opacity-50"
                                aria-label={`Preview ${file.name}`}
                              >
                                <AttachmentPreview
                                  file={file}
                                  compact
                                />
                                <span className="min-w-0 truncate">
                                  {
                                    file.name
                                  }
                                </span>
                              </button>
                            )
                          )}
                        </div>
                      ) : null}
                    </div>
                  </article>
                )
              )}
            </div>
            <div className="mt-5 border-t border-[#e1e5ec] pt-5">
              <h3 className="mb-3 text-sm font-semibold text-[#10192f] sm:text-base">
                Add a reply
              </h3>
              <textarea
                value={reply}
                onChange={(event) =>
                  setReply(
                    event.target.value
                  )
                }
                placeholder="Type your message here..."
                className={`${fieldClass} h-20 resize-y rounded-lg p-3`}
              />
              <div className="mt-3">
                <FilePicker
                  id="reply-attachment"
                  files={files}
                  onChoose={(event) =>
                    addFiles(
                      event,
                      setFiles,
                      files
                    )
                  }
                  onRemove={(index) =>
                    removeFile(
                      index,
                      files,
                      setFiles
                    )
                  }
                  onPreview={onPreview}
                  compactChips
                  submitButton={
                    <button
                      type="button"
                      className="h-10 w-[118px] shrink-0 cursor-pointer rounded-lg bg-[#e69a1a] px-2 text-[11px] font-bold text-white transition-colors hover:bg-[#d68c10] sm:h-11 sm:w-[150px] sm:text-xs"
                      onClick={onSend}
                    >
                      Send Reply
                    </button>
                  }
                />
              </div>
              {error && (
                <p
                  className="mt-2 text-xs text-[#c04b22]"
                  role="alert"
                >
                  {error}
                </p>
              )}
            </div>
          </div>
        </section>
      </div>
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
  const isPdf =
    file.type === "application/pdf";
  return (
    <div
      className="fixed inset-0 z-60 flex h-full w-full items-center justify-center overflow-hidden bg-slate-900/60 p-2 backdrop-blur-sm sm:p-4 md:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="preview-title"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <section
        className={`flex max-h-[94vh] flex-col overflow-hidden rounded-xl bg-white shadow-2xl sm:max-h-[92vh] ${
          isPdf
            ? "h-[85vh] w-full max-w-4xl"
            : "w-auto max-w-full"
        }`}
      >
        <header className="flex min-h-12 shrink-0 items-center justify-between gap-3 border-b border-[#e1e5ec] bg-white px-3 py-2.5 sm:px-4">
          <div className="flex min-w-0 flex-col gap-0.5 overflow-hidden">
            <h3
              id="preview-title"
              className="truncate text-xs font-semibold text-[#10192f] sm:text-sm"
            >
              {file.name}
            </h3>
            <span className="text-[10px] text-[#71809b] sm:text-[11px]">
              {file.size}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            {file.url && (
              <a
                href={file.url}
                download={file.name}
                aria-label={`Download ${file.name}`}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#dce3ec] bg-white text-[#526282] transition-colors hover:bg-[#f4f6f8]"
              >
                <DownloadIcon />
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close preview"
              className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-transparent text-[#152039] transition-colors hover:bg-[#f4f6f8]"
            >
              <CloseIcon />
            </button>
          </div>
        </header>
        <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-auto bg-white">
          {isPdf && file.url ? (
            <iframe
              src={file.url}
              title={file.name}
              className="h-full w-full border-0"
            />
          ) : file.url ? (
            <img
              src={file.url}
              alt={file.name}
              className="block max-h-[85vh] max-w-full object-contain"
            />
          ) : (
            <div className="p-6 text-center text-sm text-[#60708d]">
              Preview unavailable.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

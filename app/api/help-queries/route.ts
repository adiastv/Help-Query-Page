
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  "https://bthrx77f-5000.inc1.devtunnels.ms//api/v1/help-queries";

async function forwardRequest(
  request: NextRequest,
  method: "GET" | "POST",
) {
  const token = process.env.FEAG_ACCESS_TOKEN;

  if (!token) {
    return NextResponse.json(
      { success: false, message: "Server access token is not configured." },
      { status: 500 },
    );
  }

  try {
    const url = new URL(BACKEND_URL);

    if (method === "GET") {
      url.search = request.nextUrl.search;
    }

    const headers = new Headers({
      Authorization: `Bearer ${token}`,
    });

    const options: RequestInit = {
      method,
      headers,
      cache: "no-store",
    };

    if (method === "POST") {
      // Forward the multipart form, including file attachments.
      const incomingForm = await request.formData();
      const outgoingForm = new FormData();

      incomingForm.forEach((value, key) => {
        outgoingForm.append(key, value);
      });

      options.body = outgoingForm;
    }

    const backendResponse = await fetch(url, options);
    const responseBody = await backendResponse.text();

    return new NextResponse(responseBody, {
      status: backendResponse.status,
      headers: {
        "Content-Type":
          backendResponse.headers.get("content-type") ??
          "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Help queries proxy error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to reach the help queries backend." },
      { status: 502 },
    );
  }
}

export async function GET(request: NextRequest) {
  return forwardRequest(request, "GET");
}

export async function POST(request: NextRequest) {
  return forwardRequest(request, "POST");
}

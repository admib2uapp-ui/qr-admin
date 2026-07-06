import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const workerUrl = process.env.SOUNDBOX_WORKER_URL;
  const adminToken = process.env.SOUNDBOX_ADMIN_TOKEN;

  if (!workerUrl || !adminToken) {
    return NextResponse.json({ error: "Soundbox worker not configured" }, { status: 500 });
  }

  const body = await req.json().catch(() => ({}));

  const res = await fetch(`${workerUrl}/api/v1/report`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

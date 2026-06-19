import { NextResponse } from "next/server";
import { posthogQuery } from "@/lib/posthog";

export async function POST(request: Request) {
  try {
    const { query } = await request.json();
    if (!query) {
      return NextResponse.json({ error: "Missing query" }, { status: 400 });
    }
    const results = await posthogQuery(query);
    return NextResponse.json({ results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const keyManagerUrl = process.env.KEY_MANAGER_URL;
const keyManagerApiKey = process.env.KEY_MANAGER_API_KEY;

async function getAuthAdmin(request: Request) {
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) return null;
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;
  const { data: admin } = await supabaseAdmin
    .from("admins")
    .select("id, role, partner_id")
    .eq("user_id", user.id)
    .single();
  return admin || null;
}

export async function POST(request: Request) {
  try {
    const admin = await getAuthAdmin(request);
    if (!admin || admin.role !== "partner_admin" || !admin.partner_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!keyManagerUrl || !keyManagerApiKey) {
      return NextResponse.json({ error: "Key manager not configured" }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: partner } = await supabaseAdmin
      .from("partners")
      .select("name")
      .eq("id", admin.partner_id)
      .single();

    if (!partner?.name) {
      return NextResponse.json({ error: "Partner has no name set" }, { status: 400 });
    }

    const workerName = `${partner.name.toLowerCase().replace(/[^a-z0-9-]/g, '')}-api`;

    const kmRes = await fetch(`${keyManagerUrl}/secrets/rotate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${keyManagerApiKey}`,
      },
      body: JSON.stringify({ worker_name: workerName }),
    });

    const kmData = await kmRes.json();

    if (!kmRes.ok) {
      return NextResponse.json({ error: kmData.error || "Rotation failed" }, { status: kmRes.status });
    }

    return NextResponse.json({
      success: true,
      worker_name: workerName,
      new_webhook_secret: kmData.new_secret,
      message: kmData.message,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

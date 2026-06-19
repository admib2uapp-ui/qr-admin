import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function getAuthAdmin(request: Request) {
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (!token) return null;
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;
  const { data: admin } = await supabaseAdmin
    .from('admins')
    .select('id, role')
    .eq('user_id', user.id)
    .single();
  return admin || null;
}

export async function GET(request: Request) {
  try {
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const admin = await getAuthAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: pending } = await supabaseAdmin
      .from('admin_pending_merchants')
      .select('*')
      .eq('admin_id', admin.id)
      .order('created_at', { ascending: false });

    return NextResponse.json({ pendingMerchants: pending || [] });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const admin = await getAuthAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { merchant_id } = await request.json();

    if (!merchant_id || typeof merchant_id !== 'string') {
      return NextResponse.json({ error: "Missing or invalid merchant_id" }, { status: 400 });
    }

    const { data: existing } = await supabaseAdmin
      .from('admin_pending_merchants')
      .select('id')
      .eq('merchant_id', merchant_id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "This merchant ID is already pending for another admin" }, { status: 409 });
    }

    const { data: registered } = await supabaseAdmin
      .from('merchants')
      .select('id')
      .eq('merchant_id', merchant_id)
      .maybeSingle();

    if (registered) {
      return NextResponse.json({ error: "This merchant ID is already registered in the system" }, { status: 409 });
    }

    const { data: pending, error } = await supabaseAdmin
      .from('admin_pending_merchants')
      .insert({
        admin_id: admin.id,
        merchant_id,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ pending }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const admin = await getAuthAdmin(request);
    if (!admin || !id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error } = await supabaseAdmin
      .from('admin_pending_merchants')
      .delete()
      .eq('id', id)
      .eq('admin_id', admin.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

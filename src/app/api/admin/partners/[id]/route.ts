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

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const admin = await getAuthAdmin(request);
    if (!admin || admin.role !== 'super_admin') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const { data: partner, error: partnerError } = await supabaseAdmin
      .from('partners')
      .select('*')
      .eq('id', id)
      .single();

    if (partnerError || !partner) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 });
    }

    const [merchantCountRes, adminCountRes, adminsRes, merchantsRes, positionsRes] = await Promise.all([
      supabaseAdmin.from('merchants').select('*', { count: 'exact', head: true }).eq('partner_id', id),
      supabaseAdmin.from('admins').select('*', { count: 'exact', head: true }).eq('partner_id', id),
      supabaseAdmin.from('admins').select('*').eq('partner_id', id).order('created_at', { ascending: false }),
      supabaseAdmin.from('merchants').select('id, merchant_id, merchant_name, bank_code, terminal_id, created_at').eq('partner_id', id).order('merchant_name', { ascending: true }),
      supabaseAdmin.from('position_levels').select('id, position, level').eq('partner_id', id),
    ]);

    const positions = positionsRes.data || [];
    const positionMap: Record<string, { position: string; level: number }> = {};
    positions.forEach(p => { positionMap[p.id] = { position: p.position, level: p.level }; });

    const admins = (adminsRes.data || []).map(a => ({
      ...a,
      position: a.position_level_id ? positionMap[a.position_level_id]?.position : null,
      level: a.position_level_id ? positionMap[a.position_level_id]?.level : null,
    }));

    return NextResponse.json({
      partner,
      merchantCount: merchantCountRes.count || 0,
      adminCount: adminCountRes.count || 0,
      admins,
      merchants: merchantsRes.data || [],
      positions,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const admin = await getAuthAdmin(request);
    if (!admin || admin.role !== 'super_admin') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const { name } = await request.json();

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: "Missing or invalid partner name" }, { status: 400 });
    }

    const { data: partner, error } = await supabaseAdmin
      .from('partners')
      .update({ name })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ partner });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const admin = await getAuthAdmin(request);
    if (!admin || admin.role !== 'super_admin') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const [{ count: adminCount }, { count: merchantCount }] = await Promise.all([
      supabaseAdmin.from('admins').select('*', { count: 'exact', head: true }).eq('partner_id', id),
      supabaseAdmin.from('merchants').select('*', { count: 'exact', head: true }).eq('partner_id', id),
    ]);

    if (adminCount && adminCount > 0) {
      return NextResponse.json({
        error: `Cannot delete: ${adminCount} admin(s) are linked to this partner`
      }, { status: 409 });
    }

    if (merchantCount && merchantCount > 0) {
      return NextResponse.json({
        error: `Cannot delete: ${merchantCount} merchant(s) are linked to this partner`
      }, { status: 409 });
    }

    const { error } = await supabaseAdmin.from('partners').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

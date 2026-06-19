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
    .select('id, role, partner_id')
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

    let partnerId = admin.partner_id;

    if (admin.role === 'super_admin') {
      const { searchParams } = new URL(request.url);
      partnerId = searchParams.get('partner_id');
      if (!partnerId) {
        return NextResponse.json({ error: "partner_id is required" }, { status: 400 });
      }
    }

    if (!partnerId) {
      return NextResponse.json({ error: "No partner associated" }, { status: 400 });
    }

    const { data: positions } = await supabaseAdmin
      .from('position_levels')
      .select('*')
      .eq('partner_id', partnerId)
      .order('level', { ascending: true });

    return NextResponse.json({ positions: positions || [] });
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

    let { position, level, partner_id } = await request.json();

    if (!position || !level) {
      return NextResponse.json({ error: "Missing position or level" }, { status: 400 });
    }

    if (level < 1 || level > 5) {
      return NextResponse.json({ error: "Level must be between 1 and 5" }, { status: 400 });
    }

    if (admin.role === 'super_admin') {
      if (!partner_id) {
        return NextResponse.json({ error: "partner_id is required for super admin" }, { status: 400 });
      }
    } else if (admin.role === 'partner_admin') {
      partner_id = admin.partner_id;
    } else {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: pos, error } = await supabaseAdmin
      .from('position_levels')
      .insert({ partner_id, position, level })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ position: pos });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

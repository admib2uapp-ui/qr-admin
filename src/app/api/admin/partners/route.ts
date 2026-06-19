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
    if (!admin || admin.role !== 'super_admin') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: partners } = await supabaseAdmin
      .from('partners')
      .select('*')
      .order('name', { ascending: true });

    return NextResponse.json({ partners: partners || [] });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const admin = await getAuthAdmin(request);
    if (!admin || admin.role !== 'super_admin') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { name, create_default_position } = await request.json();
    if (!name) {
      return NextResponse.json({ error: "Missing partner name" }, { status: 400 });
    }

    const { data: partner, error } = await supabaseAdmin
      .from('partners')
      .insert({ name })
      .select()
      .single();

    if (error) throw error;

    let default_position = null;
    if (create_default_position) {
      const { data: pos, error: posError } = await supabaseAdmin
        .from('position_levels')
        .insert({ partner_id: partner.id, position: "Admin", level: 1 })
        .select()
        .single();
      if (posError) throw posError;
      default_position = pos;
    }

    return NextResponse.json({ partner, default_position });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

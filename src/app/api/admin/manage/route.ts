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

    const { data: admins } = await supabaseAdmin
      .from('admins')
      .select('*')
      .order('created_at', { ascending: false });

    const { data: merchants } = await supabaseAdmin
      .from('merchants')
      .select('admin_id')
      .not('admin_id', 'is', null);

    const countMap: Record<string, number> = {};
    (merchants || []).forEach(m => {
      if (m.admin_id) countMap[m.admin_id] = (countMap[m.admin_id] || 0) + 1;
    });

    const result = (admins || []).map(a => ({
      ...a,
      merchantCount: countMap[a.id] || 0,
    }));

    return NextResponse.json({ admins: result });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const currentAdmin = await getAuthAdmin(request);
    if (!currentAdmin || currentAdmin.role !== 'super_admin') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { email, role } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }

    const { data: existingUser } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (!existingUser) {
      return NextResponse.json({ error: "No user found with this email" }, { status: 404 });
    }

    const { data: existingAdmin } = await supabaseAdmin
      .from('admins')
      .select('id')
      .eq('user_id', existingUser.id)
      .maybeSingle();

    if (existingAdmin) {
      return NextResponse.json({ error: "User is already an admin" }, { status: 409 });
    }

    const { data: newAdmin, error } = await supabaseAdmin
      .from('admins')
      .insert({
        user_id: existingUser.id,
        email,
        role: role || 'company_admin',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ admin: newAdmin });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

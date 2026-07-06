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

    const { data: admins } = await supabaseAdmin
      .from('admins')
      .select('*')
      .eq('role', 'super_admin')
      .order('created_at', { ascending: false });

    return NextResponse.json({ admins: admins || [] });
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

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }

    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: "123456",
      email_confirm: true,
    });

    let userId: string | undefined;

    if (!createError) {
      userId = newUser.user.id;
      await supabaseAdmin.from('profiles').insert({
        id: userId,
        email,
        full_name: email.split('@')[0],
      }).maybeSingle();
    } else if (createError.message?.toLowerCase().includes('already')) {
      const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 10000,
      });
      userId = authUsers?.users.find(u => u.email === email)?.id;
    } else {
      throw createError;
    }

    const { data: existingAdmin } = await supabaseAdmin
      .from('admins')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (existingAdmin) {
      return NextResponse.json({ error: "User is already an admin" }, { status: 409 });
    }

    const { data: newAdmin, error } = await supabaseAdmin
      .from('admins')
      .insert({ user_id: userId, email, role: 'super_admin' })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ admin: newAdmin });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

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

    const { data: adminPositions } = await supabaseAdmin
      .from('position_levels')
      .select('id')
      .eq('position', 'Admin');

    const adminPositionIds = (adminPositions || []).map(p => p.id);

    let adminsQuery = supabaseAdmin.from('admins').select('*');
    if (adminPositionIds.length > 0) {
      const ids = adminPositionIds.map(id => `"${id}"`).join(',');
      adminsQuery = adminsQuery.or(`role.eq.super_admin,position_level_id.in.(${ids})`);
    }
    const { data: admins } = await adminsQuery.order('created_at', { ascending: false });

    const { data: merchants } = await supabaseAdmin
      .from('merchants')
      .select('partner_id')
      .not('partner_id', 'is', null);

    const countMap: Record<string, number> = {};
    (merchants || []).forEach(m => {
      if (m.partner_id) countMap[m.partner_id] = (countMap[m.partner_id] || 0) + 1;
    });

    const partnerIds = [...new Set((admins || []).map(a => a.partner_id).filter(Boolean))];
    const { data: partners } = partnerIds.length > 0
      ? await supabaseAdmin.from('partners').select('id, name').in('id', partnerIds)
      : { data: [] };
    const partnerMap: Record<string, string> = {};
    (partners || []).forEach(p => { partnerMap[p.id] = p.name; });

    const result = (admins || []).map(a => ({
      ...a,
      merchantCount: countMap[a.partner_id] || 0,
      partner_name: partnerMap[a.partner_id] || null,
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

    const { email, role, partner_id, position_level_id } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }

    if (role === 'partner_admin' && !partner_id) {
      return NextResponse.json({ error: "Partner is required for partner admin" }, { status: 400 });
    }

    if (role === 'partner_admin' && !position_level_id) {
      return NextResponse.json({ error: "Position is required for partner admin" }, { status: 400 });
    }

    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
    let userId = authUsers?.users.find(u => u.email === email)?.id;

    if (!userId) {
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: "123456",
        email_confirm: true,
      });
      if (createError) throw createError;
      userId = newUser.user.id;

      await supabaseAdmin.from('profiles').insert({
        id: userId,
        email,
        full_name: email.split('@')[0],
      }).maybeSingle();
    }

    const { data: existingAdmin } = await supabaseAdmin
      .from('admins')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (existingAdmin) {
      return NextResponse.json({ error: "User is already an admin" }, { status: 409 });
    }

    const insertData: any = {
      user_id: userId,
      email,
      role: role || 'partner_admin',
    };
    if (role === 'partner_admin') {
      insertData.partner_id = partner_id;
      insertData.position_level_id = position_level_id;
    }

    const { data: newAdmin, error } = await supabaseAdmin
      .from('admins')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ admin: newAdmin });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

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

    const partnerIds = (partners || []).map(p => p.id);

    const [merchantCountsRes, adminCountsRes] = await Promise.all([
      supabaseAdmin.from('merchants').select('partner_id').in('partner_id', partnerIds.length > 0 ? partnerIds : ['none']),
      supabaseAdmin.from('admins').select('partner_id').in('partner_id', partnerIds.length > 0 ? partnerIds : ['none']),
    ]);

    const merchantCounts: Record<string, number> = {};
    (merchantCountsRes.data || []).forEach(m => {
      merchantCounts[m.partner_id] = (merchantCounts[m.partner_id] || 0) + 1;
    });

    const adminCounts: Record<string, number> = {};
    (adminCountsRes.data || []).forEach(a => {
      adminCounts[a.partner_id] = (adminCounts[a.partner_id] || 0) + 1;
    });

    return NextResponse.json({
      partners: (partners || []).map(p => ({
        ...p,
        merchantCount: merchantCounts[p.id] || 0,
        adminCount: adminCounts[p.id] || 0,
      })),
    });
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

    const { name, admin_email } = await request.json();
    if (!name) {
      return NextResponse.json({ error: "Missing partner name" }, { status: 400 });
    }
    if (!admin_email) {
      return NextResponse.json({ error: "Missing admin email" }, { status: 400 });
    }

    const { data: partner, error } = await supabaseAdmin
      .from('partners')
      .insert({ name })
      .select()
      .single();

    if (error) throw error;

    const { data: pos, error: posError } = await supabaseAdmin
      .from('position_levels')
      .insert({ partner_id: partner.id, position: "Admin", level: 1 })
      .select()
      .single();

    if (posError) throw posError;

    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: admin_email,
      password: "123456",
      email_confirm: true,
    });

    let userId: string | undefined;

    if (!createError) {
      userId = newUser.user.id;
      await supabaseAdmin.from('profiles').insert({
        id: userId,
        email: admin_email,
        full_name: admin_email.split('@')[0],
      }).maybeSingle();
    } else if (createError.message?.toLowerCase().includes('already')) {
      const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 10000,
      });
      userId = authUsers?.users.find(u => u.email === admin_email)?.id;
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

    const { data: newAdmin, error: adminError } = await supabaseAdmin
      .from('admins')
      .insert({ user_id: userId, email: admin_email, role: 'partner_admin', partner_id: partner.id, position_level_id: pos.id })
      .select()
      .single();

    if (adminError) throw adminError;

    return NextResponse.json({ partner, admin: newAdmin });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

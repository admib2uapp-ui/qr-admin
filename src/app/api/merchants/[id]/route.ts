import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: admin } = await supabaseAdmin
      .from('admins')
      .select('id, role, partner_id')
      .eq('user_id', user.id)
      .single();

    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: merchant, error: merchantError } = await supabaseAdmin
      .from('merchants')
      .select('*')
      .eq('id', id)
      .single();

    if (merchantError || !merchant) {
      return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
    }

    const isSuperAdmin = admin.role === 'super_admin';
    if (!isSuperAdmin && admin.partner_id && merchant.partner_id !== admin.partner_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const merchantId = merchant.id;

    const [profileRes, teamRes, partnerRes, completedRes, pendingRes] = await Promise.all([
      merchant.user_id
        ? supabaseAdmin.from('profiles').select('*').eq('id', merchant.user_id).single()
        : { data: null },
      supabaseAdmin
        .from('merchant_team')
        .select('user_id, created_at')
        .eq('merchant_id', merchantId),
      merchant.partner_id
        ? supabaseAdmin.from('partners').select('id, name').eq('id', merchant.partner_id).single()
        : { data: null },
      supabaseAdmin
        .from('completed_transactions')
        .select('id, reference_no, amount, tag, created_at, user_id')
        .eq('merchant_id', merchantId)
        .order('created_at', { ascending: false })
        .limit(10),
      supabaseAdmin
        .from('transactions')
        .select('id, reference_no, amount, status, created_at, user_id')
        .eq('merchant_id', merchantId)
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

    let profile = profileRes?.data;

    if (!profile && merchant.user_id) {
      try {
        const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(merchant.user_id);
        if (authUser?.user) {
          profile = {
            id: authUser.user.id,
            email: authUser.user.email,
            full_name: null,
            company_name: null,
            whatsapp_number: null,
          };
        }
      } catch {}
    }

    const teamMembers = teamRes?.data || [];
    const partner = partnerRes?.data;

    let authUsers: any[] = [];
    try {
      const { data: au } = await supabaseAdmin.auth.admin.listUsers();
      authUsers = au?.users || [];
    } catch {}

    const authByEmail: Record<string, any> = {};
    const authById: Record<string, any> = {};
    authUsers.forEach(u => {
      authByEmail[u.email?.toLowerCase()] = u;
      authById[u.id] = u;
    });

    const authUser = profile?.email
      ? authByEmail[profile.email.toLowerCase()]
      : (merchant.user_id ? authById[merchant.user_id] : null);

    const teamUserIds = teamMembers.map((t: any) => t.user_id);
    const { data: teamProfiles } = teamUserIds.length > 0
      ? await supabaseAdmin.from('profiles').select('id, full_name, email').in('id', teamUserIds)
      : { data: [] };

    const profileMap: Record<string, any> = {};
    (teamProfiles || []).forEach((p: any) => { profileMap[p.id] = p; });

    const mapTx = (t: any, status: string) => ({
      id: t.id,
      reference_no: t.reference_no,
      amount: Number(t.amount),
      tag: t.tag || null,
      status,
      created_at: t.created_at,
      user_id: t.user_id,
    });

    const pendingMapped = (pendingRes?.data || []).map((t: any) => mapTx(t, t.status || 'pending'));
    const completedMapped = (completedRes?.data || []).map((t: any) => mapTx(t, 'completed'));

    const allRecent = [...completedMapped, ...pendingMapped]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10);

    return NextResponse.json({
      merchant,
      user: profile ? {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        company_name: profile.company_name,
        whatsapp_number: profile.whatsapp_number,
        disabled: authUser?.banned_until && new Date(authUser.banned_until) > new Date() ? true : false,
      } : null,
      team: teamMembers.map((t: any) => ({
        id: t.user_id,
        email: profileMap[t.user_id]?.email || null,
        full_name: profileMap[t.user_id]?.full_name || null,
        created_at: t.created_at,
      })),
      partner,
      recentTransactions: allRecent,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: admin } = await supabaseAdmin
      .from('admins')
      .select('id, role, partner_id')
      .eq('user_id', user.id)
      .single();

    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: merchant } = await supabaseAdmin
      .from('merchants')
      .select('id, partner_id')
      .eq('id', id)
      .single();

    if (!merchant) {
      return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
    }

    const isSuperAdmin = admin.role === 'super_admin';
    if (!isSuperAdmin && admin.partner_id && merchant.partner_id !== admin.partner_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const allowedFields: Record<string, any> = {};

    if (body.merchant_name !== undefined) allowedFields.merchant_name = body.merchant_name;
    if (isSuperAdmin && body.partner_id !== undefined) allowedFields.partner_id = body.partner_id;

    if (Object.keys(allowedFields).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    allowedFields.updated_at = new Date().toISOString();

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('merchants')
      .update(allowedFields)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ merchant: updated });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

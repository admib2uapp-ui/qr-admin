import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: Request) {
  try {
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

    const isSuperAdmin = admin.role === 'super_admin';

    let merchantQuery = supabaseAdmin
      .from('merchants')
      .select('id, user_id, merchant_id, merchant_name, is_active')
      .not('user_id', 'is', null);

    if (!isSuperAdmin && admin.partner_id) {
      merchantQuery = merchantQuery.eq('partner_id', admin.partner_id);
    }

    const { data: merchants } = await merchantQuery;

    const userIds = [...new Set((merchants || []).map(m => m.user_id))];

    if (userIds.length === 0) {
      return NextResponse.json({ users: [] });
    }

    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .in('id', userIds);

    const profileMap: Record<string, any> = {};
    (profiles || []).forEach(p => { profileMap[p.id] = p; });

    const merchantsByUser: Record<string, any[]> = {};
    (merchants || []).forEach(m => {
      if (!merchantsByUser[m.user_id]) merchantsByUser[m.user_id] = [];
      merchantsByUser[m.user_id].push(m);
    });

    const allMerchantIds = (merchants || []).map(m => m.id);
    const { data: teams } = allMerchantIds.length > 0
      ? await supabaseAdmin.from('merchant_team').select('merchant_id').in('merchant_id', allMerchantIds)
      : { data: [] };
    const teamMerchantIds = new Set((teams || []).map((t: any) => t.merchant_id));

    let authUsers: any[] = [];
    try {
      const { data: au } = await supabaseAdmin.auth.admin.listUsers();
      authUsers = au?.users || [];
    } catch {}

    const authByEmail: Record<string, any> = {};
    authUsers.forEach(u => {
      authByEmail[u.email?.toLowerCase()] = u;
    });

    const users = userIds.map(uid => {
      const p = profileMap[uid] || {};
      const authUser = authByEmail[p.email?.toLowerCase()] ||
        authUsers.find(u => u.id === uid);

      const userMerchants = merchantsByUser[uid] || [];
      const isCompany = userMerchants.some(m => teamMerchantIds.has(m.id));

      return {
        id: uid,
        full_name: userMerchants[0]?.merchant_name || p.full_name || null,
        email: authUser?.email || null,
        company_name: p.company_name || null,
        whatsapp_number: p.whatsapp_number || null,
        phone: p.whatsapp_number || null,
        role: isCompany ? 'company' : 'individual',
        merchantCount: userMerchants.length,
        merchants: userMerchants,
        disabled: authUser?.banned_until && new Date(authUser.banned_until) > new Date() ? true : false,
        created_at: p.updated_at || null,
      };
    });

    return NextResponse.json({ users });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

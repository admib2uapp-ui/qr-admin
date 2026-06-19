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
      .select('id, role')
      .eq('user_id', user.id)
      .single();

    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const isSuperAdmin = admin.role === 'super_admin';

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString();

    let merchantQuery = supabaseAdmin.from('merchants').select('*', { count: 'exact', head: true });
    let todayTxQuery = supabaseAdmin.from('completed_transactions').select('amount, tag').gte('created_at', todayStr);
    let todayCountQuery = supabaseAdmin.from('completed_transactions').select('*', { count: 'exact', head: true }).gte('created_at', todayStr);
    let totalTxQuery = supabaseAdmin.from('completed_transactions').select('*', { count: 'exact', head: true });
    let recentTxQuery = supabaseAdmin.from('completed_transactions').select('id, reference_no, amount, created_at, merchant_id').order('created_at', { ascending: false }).limit(5);

    if (!isSuperAdmin) {
      const { data: adminMerchants } = await supabaseAdmin
        .from('merchants')
        .select('id')
        .eq('admin_id', admin.id);
      const ids = (adminMerchants || []).map(m => m.id);

      if (ids.length > 0) {
        merchantQuery = merchantQuery.in('id', ids);
        todayTxQuery = todayTxQuery.in('merchant_id', ids);
        todayCountQuery = todayCountQuery.in('merchant_id', ids);
        totalTxQuery = totalTxQuery.in('merchant_id', ids);
        recentTxQuery = recentTxQuery.in('merchant_id', ids);
      } else {
        merchantQuery = merchantQuery.eq('id', 'none');
        todayTxQuery = todayTxQuery.eq('merchant_id', 'none');
        todayCountQuery = todayCountQuery.eq('merchant_id', 'none');
        totalTxQuery = totalTxQuery.eq('merchant_id', 'none');
        recentTxQuery = recentTxQuery.eq('merchant_id', 'none');
      }
    }

    const [{ count: merchantCount }, { count: userCount }, { count: todayTxCount }, { data: todayTransactions }, { count: totalTxCount }, { data: recentTransactions }] = await Promise.all([
      merchantQuery,
      supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }),
      todayCountQuery,
      todayTxQuery,
      totalTxQuery,
      recentTxQuery,
    ]);

    const todayVolume = (todayTransactions || []).reduce((sum, t) => sum + Number(t.amount), 0);

    const todayBreakdown = { QR: { volume: 0, count: 0 }, CASH: { volume: 0, count: 0 }, CREDIT: { volume: 0, count: 0 } };
    (todayTransactions || []).forEach(t => {
      let key: keyof typeof todayBreakdown = 'QR';
      if (t.tag === 'CASH') key = 'CASH';
      else if (t.tag === 'CREDIT') key = 'CREDIT';
      todayBreakdown[key].volume += Number(t.amount);
      todayBreakdown[key].count++;
    });

    const merchantIds = [...new Set((recentTransactions || []).map(t => t.merchant_id))];
    const { data: merchants } = merchantIds.length > 0
      ? await supabaseAdmin.from('merchants').select('id, merchant_name').in('id', merchantIds)
      : { data: [] };
    const merchantMap: Record<string, string> = {};
    (merchants || []).forEach(m => { merchantMap[m.id] = m.merchant_name; });

    return NextResponse.json({
      merchantCount: merchantCount || 0,
      userCount: userCount || 0,
      todayTransactions: todayTxCount || 0,
      todayVolume,
      todayBreakdown,
      totalTransactions: totalTxCount || 0,
      recentTransactions: (recentTransactions || []).map(t => ({
        id: t.id,
        reference_no: t.reference_no,
        amount: Number(t.amount),
        created_at: t.created_at,
        merchant_name: merchantMap[t.merchant_id] || 'Unknown',
      })),
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

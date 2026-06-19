import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.toLowerCase() || '';
    const status = searchParams.get('status') || '';
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
    let scopeIds: string[] | null = null;

    if (!isSuperAdmin) {
      const { data: adminMerchants } = await supabaseAdmin
        .from('merchants')
        .select('id')
        .eq('admin_id', admin.id);
      scopeIds = (adminMerchants || []).map(m => m.id);
      if (scopeIds.length === 0) {
        return NextResponse.json({ transactions: [], totalAmount: 0 });
      }
    }

    const applyScope = (q: any) => scopeIds ? q.in('merchant_id', scopeIds) : q;

    const [completedRes, cancelledRes, pendingRes] = await Promise.all([
      applyScope(
        supabaseAdmin.from('completed_transactions').select('*').order('created_at', { ascending: false })
      ).limit(1000),
      applyScope(
        supabaseAdmin.from('cancelled_transactions').select('*').order('created_at', { ascending: false })
      ).limit(1000),
      applyScope(
        supabaseAdmin.from('transactions').select('*').order('created_at', { ascending: false })
      ).limit(1000),
    ]);
    const completed = completedRes.data;
    const cancelled = cancelledRes.data;
    const pending = pendingRes.data;

    const userIds = new Set<string>();
    const merchantIds = new Set<string>();

    [...(completed || []), ...(cancelled || []), ...(pending || [])].forEach(t => {
      if (t.user_id) userIds.add(t.user_id);
      if (t.merchant_id) merchantIds.add(t.merchant_id);
    });

    const { data: profiles } = userIds.size > 0
      ? await supabaseAdmin.from('profiles').select('id, full_name').in('id', [...userIds])
      : { data: [] };

    const { data: merchants } = merchantIds.size > 0
      ? await supabaseAdmin.from('merchants').select('id, merchant_id, merchant_name').in('id', [...merchantIds])
      : { data: [] };

    const profileMap: Record<string, string> = {};
    (profiles || []).forEach(p => { profileMap[p.id] = p.full_name || 'Unknown'; });

    const merchantMap: Record<string, any> = {};
    (merchants || []).forEach(m => { merchantMap[m.id] = m; });

    const mapTx = (t: any, type: string) => ({
      id: t.id,
      reference_no: t.reference_no,
      invoice_no: t.invoice_no || '-',
      amount: Number(t.amount),
      currency: 'LKR',
      status: type === 'completed' ? 'SUCCESS' : type === 'cancelled' ? 'FAILED' : 'PENDING',
      created_at: t.created_at,
      user_id: t.user_id,
      user_name: profileMap[t.user_id] || 'Unknown',
      merchant_id: t.merchant_id,
      merchant_name: merchantMap[t.merchant_id]?.merchant_name || 'Unknown',
      merchant_id_str: merchantMap[t.merchant_id]?.merchant_id || '',
      tag: t.tag || null,
    });

    const deduplicated = new Map<string, any>();
    (pending || []).forEach((t: any) => deduplicated.set(t.reference_no, mapTx(t, 'pending')));
    (completed || []).forEach((t: any) => deduplicated.set(t.reference_no, mapTx(t, 'completed')));
    (cancelled || []).forEach((t: any) => deduplicated.set(t.reference_no, mapTx(t, 'cancelled')));

    let transactions = Array.from(deduplicated.values())
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    if (search) {
      transactions = transactions.filter(t =>
        t.reference_no?.toLowerCase().includes(search) ||
        t.user_name?.toLowerCase().includes(search) ||
        t.merchant_name?.toLowerCase().includes(search) ||
        t.invoice_no?.toLowerCase().includes(search)
      );
    }

    if (status) {
      transactions = transactions.filter(t => t.status === status.toUpperCase());
    }

    const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);

    return NextResponse.json({ transactions, totalAmount });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

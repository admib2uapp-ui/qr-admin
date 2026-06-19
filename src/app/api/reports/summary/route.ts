import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const merchantId = searchParams.get('merchantId');

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
        return NextResponse.json({ transactions: [] });
      }
    }

    let finalMerchantIds = scopeIds;

    if (merchantId && merchantId !== 'ALL') {
      if (scopeIds && !scopeIds.includes(merchantId)) {
        return NextResponse.json({ transactions: [] });
      }
      finalMerchantIds = [merchantId];
    }

    const buildQuery = (table: string) => {
      let q = supabaseAdmin.from(table).select('*');
      if (finalMerchantIds) {
        q = q.in('merchant_id', finalMerchantIds);
      }
      if (startDate) {
        q = q.gte('created_at', startDate);
      }
      if (endDate) {
        const end = endDate.length === 10 ? endDate + 'T23:59:59.999Z' : endDate;
        q = q.lte('created_at', end);
      }
      return q.order('created_at', { ascending: false });
    };

    const [completedRes, cancelledRes, pendingRes] = await Promise.all([
      buildQuery('completed_transactions'),
      buildQuery('cancelled_transactions'),
      buildQuery('transactions'),
    ]);

    const completed = completedRes.data;
    const cancelled = cancelledRes.data;
    const pending = pendingRes.data;

    const mapTx = (t: any, type: string) => ({
      id: t.id,
      transaction_uuid: t.transaction_uuid,
      reference_no: t.reference_no,
      amount: Number(t.amount),
      currency: 'LKR',
      status: type === 'completed' ? 'SUCCESS' : type === 'cancelled' ? 'FAILED' : 'PENDING',
      created_at: t.created_at,
      merchant_id: t.merchant_id,
    });

    const deduplicated = new Map<string, any>();
    (pending || []).forEach((t: any) => deduplicated.set(t.reference_no, mapTx(t, 'pending')));
    (completed || []).forEach((t: any) => deduplicated.set(t.reference_no, mapTx(t, 'completed')));
    (cancelled || []).forEach((t: any) => deduplicated.set(t.reference_no, mapTx(t, 'cancelled')));

    const transactions = Array.from(deduplicated.values())
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json({ transactions });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

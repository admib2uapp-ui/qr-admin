import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status') || '';

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
    let scopeIds: string[] | null = null;

    if (!isSuperAdmin && admin.partner_id) {
      const { data: partnerMerchants } = await supabaseAdmin
        .from('merchants')
        .select('id')
        .eq('partner_id', admin.partner_id);
      scopeIds = (partnerMerchants || []).map(m => m.id);
      if (scopeIds.length === 0) {
        return NextResponse.json({ tickets: [] });
      }
    }

    let query = supabaseAdmin
      .from('helpdesk_tickets')
      .select('id, merchant_id, transaction_id, ticket_type, reason, status, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (scopeIds) {
      query = query.in('merchant_id', scopeIds);
    }

    if (statusFilter) {
      query = query.eq('status', statusFilter);
    }

    const { data: tickets, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const merchantIds = [...new Set((tickets || []).map(t => t.merchant_id))];

    const { data: merchants } = merchantIds.length > 0
      ? await supabaseAdmin.from('merchants').select('id, merchant_id, merchant_name').in('id', merchantIds)
      : { data: [] };

    const merchantMap: Record<string, any> = {};
    (merchants || []).forEach(m => { merchantMap[m.id] = m; });

    const ticketIds = (tickets || []).map(t => t.id);
    const { data: messageCounts } = ticketIds.length > 0
      ? await supabaseAdmin.from('helpdesk_ticket_messages').select('ticket_id').in('ticket_id', ticketIds)
      : { data: [] };

    const countMap: Record<string, number> = {};
    (messageCounts || []).forEach(m => {
      countMap[m.ticket_id] = (countMap[m.ticket_id] || 0) + 1;
    });

    const result = (tickets || []).map(t => ({
      id: t.id,
      ticket_type: t.ticket_type,
      reason: t.reason,
      status: t.status,
      created_at: t.created_at,
      updated_at: t.updated_at,
      transaction_id: t.transaction_id,
      merchant_id: t.merchant_id,
      merchant_name: merchantMap[t.merchant_id]?.merchant_name || 'Unknown',
      merchant_id_str: merchantMap[t.merchant_id]?.merchant_id || '',
      message_count: countMap[t.id] || 0,
    }));

    return NextResponse.json({ tickets: result });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function getAdmin(supabaseAdmin: any, request: Request) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (!token) return null;

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) return null;

  const { data: admin } = await supabaseAdmin
    .from('admins')
    .select('id, role, partner_id')
    .eq('user_id', user.id)
    .single();

  return admin;
}

async function canAccessTicket(supabaseAdmin: any, admin: any, ticketId: string) {
  const { data: ticket } = await supabaseAdmin
    .from('helpdesk_tickets')
    .select('merchant_id')
    .eq('id', ticketId)
    .single();

  if (!ticket) return null;

  if (admin.role === 'super_admin') return ticket;

  const { data: merchant } = await supabaseAdmin
    .from('merchants')
    .select('partner_id')
    .eq('id', ticket.merchant_id)
    .single();

  if (merchant && merchant.partner_id === admin.partner_id) return ticket;

  return null;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const admin = await getAdmin(supabaseAdmin, request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ticket = await canAccessTicket(supabaseAdmin, admin, id);
    if (!ticket) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { data: ticketData } = await supabaseAdmin
      .from('helpdesk_tickets')
      .select('*')
      .eq('id', id)
      .single();

    const { data: merchant } = await supabaseAdmin
      .from('merchants')
      .select('id, merchant_id, merchant_name')
      .eq('id', ticketData.merchant_id)
      .single();

    const { data: messages } = await supabaseAdmin
      .from('helpdesk_ticket_messages')
      .select('*')
      .eq('ticket_id', id)
      .order('created_at', { ascending: true });

    let transaction = null;
    if (ticketData.transaction_id) {
      for (const table of ['transactions', 'completed_transactions', 'cancelled_transactions']) {
        const { data: tx } = await supabaseAdmin
          .from(table)
          .select('*')
          .eq('id', ticketData.transaction_id)
          .maybeSingle();
        if (tx) {
          transaction = { ...tx, source_table: table };
          break;
        }
      }
    }

    return NextResponse.json({
      ticket: {
        ...ticketData,
        merchant_name: merchant?.merchant_name || 'Unknown',
        merchant_id_str: merchant?.merchant_id || '',
      },
      messages: messages || [],
      transaction,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const admin = await getAdmin(supabaseAdmin, request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ticket = await canAccessTicket(supabaseAdmin, admin, id);
    if (!ticket) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await request.json();
    const { status } = body;

    if (!status || !['open', 'resolved', 'closed'].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const { data: updated, error } = await supabaseAdmin
      .from('helpdesk_tickets')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ticket: updated });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

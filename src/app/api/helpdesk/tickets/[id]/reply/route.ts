import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

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

    const { data: ticket } = await supabaseAdmin
      .from('helpdesk_tickets')
      .select('merchant_id')
      .eq('id', id)
      .single();

    if (!ticket) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (admin.role !== 'super_admin') {
      const { data: merchant } = await supabaseAdmin
        .from('merchants')
        .select('partner_id')
        .eq('id', ticket.merchant_id)
        .single();

      if (!merchant || merchant.partner_id !== admin.partner_id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const body = await request.json();
    const { message } = body;

    if (!message || !message.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const { data: reply, error: insertError } = await supabaseAdmin
      .from('helpdesk_ticket_messages')
      .insert({
        ticket_id: id,
        sender_id: admin.id,
        sender_role: 'admin',
        message: message.trim(),
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    await supabaseAdmin
      .from('helpdesk_tickets')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', id);

    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

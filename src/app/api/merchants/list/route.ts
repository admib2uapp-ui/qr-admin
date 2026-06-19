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

    let query = supabaseAdmin
      .from('merchants')
      .select('id, merchant_id, merchant_name, bank_code')
      .order('merchant_name', { ascending: true });

    if (!isSuperAdmin) {
      query = query.eq('admin_id', admin.id);
    }

    const { data: merchants } = await query;

    return NextResponse.json({ merchants: merchants || [] });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

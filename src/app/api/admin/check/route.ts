import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ admin: null }, { status: 401 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ admin: null }, { status: 401 });
    }

    const { data: admin } = await supabaseAdmin
      .from('admins')
      .select('id, user_id, email, role')
      .eq('user_id', user.id)
      .single();

    if (!admin) {
      return NextResponse.json({ admin: null }, { status: 403 });
    }

    return NextResponse.json({ admin });
  } catch {
    return NextResponse.json({ admin: null }, { status: 500 });
  }
}

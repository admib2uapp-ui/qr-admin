import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: Request) {
  try {
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { uid, disabled } = await request.json();

    if (!uid) {
      return NextResponse.json({ error: "Missing uid" }, { status: 400 });
    }

    await supabaseAdmin.auth.admin.updateUserById(uid, {
      ban_duration: disabled ? '876000h' : 'none',
    });

    return NextResponse.json({ success: true, uid, disabled });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

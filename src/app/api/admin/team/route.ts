import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function getAuthAdmin(request: Request) {
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (!token) return null;
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;
  const { data: admin } = await supabaseAdmin
    .from('admins')
    .select('id, user_id, role, partner_id, position_level_id')
    .eq('user_id', user.id)
    .single();
  return admin || null;
}

export async function GET(request: Request) {
  try {
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const currentAdmin = await getAuthAdmin(request);
    if (!currentAdmin || currentAdmin.role !== 'partner_admin' || !currentAdmin.partner_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: currentLevel } = await supabaseAdmin
      .from('position_levels')
      .select('level')
      .eq('id', currentAdmin.position_level_id)
      .single();

    const adminLevel = currentLevel?.level || 5;

    const { data: positionLevels } = await supabaseAdmin
      .from('position_levels')
      .select('id, level')
      .eq('partner_id', currentAdmin.partner_id);

    const visibleLevelIds = (positionLevels || [])
      .filter(pl => pl.level >= adminLevel)
      .map(pl => pl.id);

    const { data: admins } = await supabaseAdmin
      .from('admins')
      .select('id, user_id, email, role, partner_id, position_level_id, created_at')
      .eq('partner_id', currentAdmin.partner_id)
      .in('position_level_id', visibleLevelIds.length > 0 ? visibleLevelIds : ['none'])
      .order('created_at', { ascending: false });

    const levelIds = [...new Set((admins || []).map(a => a.position_level_id).filter(Boolean))];
    const { data: levels } = levelIds.length > 0
      ? await supabaseAdmin.from('position_levels').select('*').in('id', levelIds)
      : { data: [] };

    const levelMap: Record<string, any> = {};
    (levels || []).forEach(l => { levelMap[l.id] = l; });

    const result = (admins || []).map(a => ({
      ...a,
      position: levelMap[a.position_level_id]?.position || null,
      level: levelMap[a.position_level_id]?.level || null,
    }));

    return NextResponse.json({ team: result, currentLevel: adminLevel });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const currentAdmin = await getAuthAdmin(request);
    if (!currentAdmin || currentAdmin.role !== 'partner_admin' || !currentAdmin.partner_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { email, position_level_id } = await request.json();

    if (!email || !position_level_id) {
      return NextResponse.json({ error: "Missing email or position" }, { status: 400 });
    }

    const { data: targetLevel } = await supabaseAdmin
      .from('position_levels')
      .select('level')
      .eq('id', position_level_id)
      .single();

    if (!targetLevel) {
      return NextResponse.json({ error: "Position not found" }, { status: 404 });
    }

    const { data: currentLevel } = await supabaseAdmin
      .from('position_levels')
      .select('level')
      .eq('id', currentAdmin.position_level_id)
      .single();

    if (targetLevel.level <= (currentLevel?.level || 0)) {
      return NextResponse.json({ error: "Cannot add admin at same or higher level" }, { status: 403 });
    }

    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
    let userId = authUsers?.users.find(u => u.email === email)?.id;

    if (!userId) {
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: "123456",
        email_confirm: true,
      });
      if (createError) throw createError;
      userId = newUser.user.id;

      await supabaseAdmin.from('profiles').insert({
        id: userId,
        email,
        full_name: email.split('@')[0],
      }).maybeSingle();
    }

    const { data: existingAdmin } = await supabaseAdmin
      .from('admins')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (existingAdmin) {
      return NextResponse.json({ error: "User is already an admin" }, { status: 409 });
    }

    const { data: newAdmin, error } = await supabaseAdmin
      .from('admins')
      .insert({
        user_id: userId,
        email,
        role: 'partner_admin',
        partner_id: currentAdmin.partner_id,
        position_level_id,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ admin: newAdmin });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

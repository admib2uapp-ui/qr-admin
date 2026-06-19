import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";
import { readFileSync } from "fs";
import { resolve } from "path";

const envPath = resolve(__dirname, "../.env.local");
const envContent = readFileSync(envPath, "utf-8");
const env: Record<string, string> = {};
envContent.split("\n").forEach(line => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return;
  const idx = trimmed.indexOf("=");
  if (idx === -1) return;
  const k = trimmed.slice(0, idx).trim();
  const v = trimmed.slice(idx + 1).trim();
  if (k) env[k] = v;
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const [email, password] = process.argv.slice(2);

if (!email || !password) {
  console.error("Usage: npx tsx scripts/create-super-admin.ts <email> <password>");
  process.exit(1);
}

async function main() {
  const supabase = createClient(supabaseUrl, serviceKey, {
    realtime: { transport: WebSocket as any },
  });

  const { data: authUser, error: createError } = await supabase.auth.admin.createUser({
    email, password, email_confirm: true,
  });

  if (createError) {
    console.error("Failed to create auth user:", createError.message);
    process.exit(1);
  }

  const userId = authUser.user.id;
  console.log("Auth user created:", userId);

  const { error: profileError } = await supabase.from("profiles").insert({
    id: userId, email, full_name: email.split("@")[0],
  });

  if (profileError) {
    console.warn("Profile insert warning:", profileError.message);
  }

  const { error: adminError } = await supabase.from("admins").insert({
    user_id: userId, email, role: "super_admin",
  });

  if (adminError) {
    console.error("Failed to create admin record:", adminError.message);
    process.exit(1);
  }

  console.log("Super admin record created");
  console.log(`Done. Sign in at /signin with ${email}`);
}

main();

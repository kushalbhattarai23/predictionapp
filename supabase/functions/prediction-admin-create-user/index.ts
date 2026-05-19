import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return j({ error: "missing auth" }, 401);

    // Verify caller is an admin in football_user_roles
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: ures } = await userClient.auth.getUser();
    const callerId = ures?.user?.id;
    if (!callerId) return j({ error: "unauthenticated" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: roleRow } = await admin
      .from("football_user_roles")
      .select("role")
      .eq("user_id", callerId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) return j({ error: "forbidden" }, 403);

    const body = await req.json().catch(() => ({}));
    const { email, password, username, full_name, makeAdmin } = body ?? {};
    if (!email || !password || !username) return j({ error: "email, password, username required" }, 400);

    // Create the auth user (confirmed)
    const { data: created, error: cErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username, full_name: full_name ?? null },
    });
    if (cErr) return j({ error: cErr.message }, 400);
    const newId = created.user?.id;
    if (!newId) return j({ error: "no user id returned" }, 500);

    // Upsert profile (trigger may have created it). Ensure active + correct username.
    await admin
      .from("football_profiles")
      .upsert({ id: newId, username, full_name: full_name ?? null, is_active: true }, { onConflict: "id" });

    if (makeAdmin) {
      await admin
        .from("football_user_roles")
        .upsert({ user_id: newId, role: "admin" }, { onConflict: "user_id,role" });
    }

    return j({ ok: true, user_id: newId });
  } catch (e) {
    return j({ error: (e as Error).message }, 500);
  }
});

function j(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

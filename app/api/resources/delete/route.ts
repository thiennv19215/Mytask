const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getSupabaseConfig() {
  const supabaseUrl = (process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL)?.replace(/\/+$/, "");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return { supabaseUrl, serviceRoleKey };
}

export async function POST(request: Request) {
  const config = getSupabaseConfig();

  if (!config) {
    return Response.json(
      { success: false, message: "Missing Supabase service role configuration" },
      { status: 500 }
    );
  }

  const body = (await request.json().catch(() => null)) as { id?: unknown; deleteAll?: unknown } | null;

  if (body?.deleteAll === true) {
    const response = await fetch(
      `${config.supabaseUrl}/rest/v1/genjob?status=in.(success,failed)&deleted_at=is.null`,
      {
        method: "PATCH",
        headers: {
          apikey: config.serviceRoleKey,
          Authorization: `Bearer ${config.serviceRoleKey}`,
          "Content-Type": "application/json",
          Prefer: "return=representation"
        },
        body: JSON.stringify({
          deleted_at: new Date().toISOString()
        })
      }
    );

    const text = await response.text();

    if (!response.ok) {
      return Response.json(
        { success: false, message: text || `Delete all failed: ${response.status}` },
        { status: response.status }
      );
    }

    const rows = text ? (JSON.parse(text) as unknown[]) : [];
    return Response.json({ success: true, deletedCount: rows.length });
  }

  const id = typeof body?.id === "string" ? body.id.trim() : "";

  if (!uuidPattern.test(id)) {
    return Response.json({ success: false, message: "Invalid resource id" }, { status: 400 });
  }

  const response = await fetch(`${config.supabaseUrl}/rest/v1/genjob?id=eq.${id}`, {
    method: "PATCH",
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation"
    },
    body: JSON.stringify({
      deleted_at: new Date().toISOString()
    })
  });

  const text = await response.text();

  if (!response.ok) {
    return Response.json(
      { success: false, message: text || `Delete failed: ${response.status}` },
      { status: response.status }
    );
  }

  const rows = text ? (JSON.parse(text) as unknown[]) : [];

  if (rows.length === 0) {
    return Response.json({ success: false, message: "Resource not found" }, { status: 404 });
  }

  return Response.json({ success: true, id });
}

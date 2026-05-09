const N8N_BASE_URL =
  process.env.N8N_BASE_URL ?? process.env.NEXT_PUBLIC_N8N_BASE_URL ?? "http://localhost:5678";
const N8N_IMAGE_WEBHOOK_PATH = process.env.N8N_IMAGE_WEBHOOK_PATH ?? "/webhook/image";

export async function POST(request: Request) {
  const body = await request.text();

  const response = await fetch(`${N8N_BASE_URL}${N8N_IMAGE_WEBHOOK_PATH}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body
  });

  const text = await response.text();

  return new Response(text, {
    status: response.status,
    headers: {
      "Content-Type": response.headers.get("Content-Type") ?? "application/json"
    }
  });
}

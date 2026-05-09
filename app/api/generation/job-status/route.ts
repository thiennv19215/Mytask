const N8N_BASE_URL =
  process.env.N8N_BASE_URL ?? process.env.NEXT_PUBLIC_N8N_BASE_URL ?? "http://localhost:5678";
const N8N_JOB_STATUS_WEBHOOK_PATH = process.env.N8N_JOB_STATUS_WEBHOOK_PATH ?? "/webhook/job-status";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const jobId = url.searchParams.get("jobId") ?? "";
  const params = new URLSearchParams({ jobId });

  const response = await fetch(`${N8N_BASE_URL}${N8N_JOB_STATUS_WEBHOOK_PATH}?${params.toString()}`);
  const text = await response.text();

  return new Response(text, {
    status: response.status,
    headers: {
      "Content-Type": response.headers.get("Content-Type") ?? "application/json"
    }
  });
}

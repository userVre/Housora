import { onRequestPost } from "@/functions/api/webhooks/whop.js";
export const runtime = "nodejs";
export function POST(request: Request) { return onRequestPost({ request, env: process.env }); }

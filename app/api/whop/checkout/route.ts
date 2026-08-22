import { onRequestOptions, onRequestPost } from "@/functions/api/whop/checkout.js";
export const runtime = "nodejs";
export function OPTIONS(request: Request) { return onRequestOptions({ request, env: process.env }); }
export function POST(request: Request) { return onRequestPost({ request, env: process.env }); }

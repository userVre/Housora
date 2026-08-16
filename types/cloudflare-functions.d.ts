declare module "@/functions/api/generate.js" {
  export function onRequestPost(context: { request: Request; env: NodeJS.ProcessEnv }): Promise<Response>;
  export function onRequestOptions(context: { request: Request; env: NodeJS.ProcessEnv }): Response;
}
declare module "@/functions/api/whop/checkout.js" {
  export function onRequestPost(context: { request: Request; env: NodeJS.ProcessEnv }): Promise<Response>;
  export function onRequestOptions(context: { request: Request; env: NodeJS.ProcessEnv }): Response;
}
declare module "@/functions/api/webhooks/whop.js" {
  export function onRequestPost(context: { request: Request; env: NodeJS.ProcessEnv }): Promise<Response>;
}

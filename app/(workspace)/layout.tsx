import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV === "development" && process.env.HOUSORA_LOCAL_AUTH_PREVIEW === "true") return children;
  if (!process.env.CLERK_SECRET_KEY) redirect("/sign-in?configuration=required");
  const { userId } = await auth();
  if (!userId) redirect(`/sign-in?redirect=${encodeURIComponent("/app/home")}`);
  return children;
}

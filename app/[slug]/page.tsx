import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { redirect } from "next/navigation";
import { ToolLandingPage } from "@/components/tools/ToolLandingPage";
import { toolConfigs } from "@/lib/tool-data";

export const dynamic = "force-dynamic";

export function generateStaticParams() { return Object.keys(toolConfigs).map((slug) => ({ slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const config = toolConfigs[slug];
  return config ? { title: config.title, description: config.description } : {};
}

export default async function SingleSegmentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const config = toolConfigs[slug];
  if (!config) notFound();
  const localPreview = process.env.NODE_ENV === "development" && process.env.HOUSORA_LOCAL_AUTH_PREVIEW === "true";
  if (!localPreview) {
    if (!process.env.CLERK_SECRET_KEY) redirect("/sign-in?configuration=required");
    const { userId } = await auth();
    if (!userId) redirect(`/sign-in?redirect=${encodeURIComponent(`/${slug}`)}`);
  }
  return <ToolLandingPage config={config} />;
}

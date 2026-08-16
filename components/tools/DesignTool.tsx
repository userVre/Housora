"use client";

import Image from "next/image";
import { useAuth } from "@clerk/nextjs";
import { useState } from "react";
import { useAnalytics } from "@/components/privacy/AnalyticsProvider";
import { readConsent } from "@/lib/consent";
import type { ToolConfig } from "@/lib/tool-data";

const styles = ["Scandinavian", "Modern", "Coastal", "Japandi", "Minimalist", "Industrial", "Luxury", "Farmhouse"];
const palettes = ["Neutral", "Warm", "Cool", "Earth", "Monochrome", "Surprise me"];

export function DesignTool({ config }: { config: ToolConfig }) {
  const [file, setFile] = useState<File | null>(null);
  const [style, setStyle] = useState(styles[0]);
  const [palette, setPalette] = useState(palettes[0]);
  const [prompt, setPrompt] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "generating" | "complete">("idle");
  const [error, setError] = useState("");
  const { getToken, isSignedIn } = useAuth();
  const { capture } = useAnalytics();

  const generate = async () => {
    if (!file) return;
    if (!isSignedIn) {
      window.location.assign(`/sign-up?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    setError("");
    setResultUrl(null);
    setStatus("generating");
    const startedAt = Date.now();
    capture("generation_started", { tool: config.title });
    try {
      const token = await getToken();
      if (!token) throw new Error("Could not verify your session. Please sign in again.");
      const image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || "").split(",", 2)[1] || "");
        reader.onerror = () => reject(new Error("Could not read the selected image."));
        reader.readAsDataURL(file);
      });
      const consent = readConsent();
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-Housora-Analytics-Consent": consent?.analytics
            ? `v3;analytics=1;timestamp=${consent.timestamp}`
            : "v3;analytics=0",
        },
        body: JSON.stringify({
          image,
          prompt: `${config.title}. ${style} style, ${palette} palette. ${prompt || config.prompt}`.slice(0, 2000),
        }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null) as { error?: { message?: string } | string } | null;
        const message = typeof payload?.error === "string" ? payload.error : payload?.error?.message;
        throw new Error(message || "Generation failed. Please try again.");
      }
      const output = await response.blob();
      if (!output.type.startsWith("image/") || !output.size) throw new Error("The image provider returned an invalid result.");
      setResultUrl(URL.createObjectURL(output));
      setStatus("complete");
      const duration = Date.now() - startedAt;
      capture("generation_succeeded", { duration_bucket: duration < 10_000 ? "under_10s" : duration < 30_000 ? "10_to_30s" : duration < 60_000 ? "30_to_60s" : "over_60s" });
    } catch (cause) {
      const duration = Date.now() - startedAt;
      capture("generation_failed", { duration_bucket: duration < 10_000 ? "under_10s" : duration < 30_000 ? "10_to_30s" : duration < 60_000 ? "30_to_60s" : "over_60s" });
      setError(cause instanceof Error ? cause.message : "Generation failed. Please try again.");
      setStatus("idle");
    }
  };

  return <section className="id-configure-section" id="try-it-now"><div className="workspace-tool-heading"><div><span className="workspace-eyebrow">AI TOOL</span><h2 className="id-configure-title">{config.title}</h2><p>Upload your image, choose your preferences, and generate a design you can review.</p></div><ol className="workspace-tool-steps" aria-label="Generation steps"><li><span>1</span>Upload</li><li><span>2</span>Preferences</li><li><span>3</span>Generate</li></ol></div><div className="id-configure-inner"><div className="id-configure-grid"><div className="id-configure-left"><label className="id-upload-area"><input type="file" accept="image/jpeg,image/png,image/webp" className="id-upload-input" onChange={(event) => { const selected = event.target.files?.[0] || null; setError(""); setResultUrl(null); setFile(selected); setPreviewUrl(selected ? URL.createObjectURL(selected) : null); if (selected) capture("image_uploaded", { file_type: selected.type, file_size_bucket: selected.size < 1_000_000 ? "small" : selected.size < 5_000_000 ? "medium" : "large" }); }} />{previewUrl ? <span className="id-upload-preview"><Image src={previewUrl} alt="Selected room" fill unoptimized sizes="(max-width: 900px) 100vw, 50vw" /></span> : <span className="id-upload-placeholder"><span className="id-upload-stack-icon">↑</span><strong className="id-upload-title">{config.title.toUpperCase()}</strong><span className="id-upload-subtitle">Upload a clear photo to begin</span><span className="id-upload-formats">JPG · PNG · WEBP · MAX 8 MB</span></span>}</label>{resultUrl && <div className="id-result" aria-live="polite"><span className="id-config-label">GENERATED CONCEPT</span><Image src={resultUrl} alt={`Generated ${config.title} concept`} width={900} height={700} unoptimized /><a href={resultUrl} download="housora-design.png" className="btn-secondary">Download result</a></div>}</div><div className="id-configure-right"><fieldset className="id-config-section"><legend className="id-config-label">STYLE</legend><div className="id-card-grid">{styles.map((name) => <button className={`id-card ${style === name ? "active" : ""}`} type="button" aria-pressed={style === name} onClick={() => setStyle(name)} key={name}><Image src={name === "Coastal" ? "/static/images/interior-coastal.jpg" : "/static/images/s-modern.jpg"} alt="" width={150} height={100} /><span className="id-card-label">{name}</span></button>)}</div></fieldset><fieldset className="id-config-section"><legend className="id-config-label">COLOR PALETTE</legend><div className="id-palette-grid">{palettes.map((name) => <button className={`id-palette ${palette === name ? "active" : ""}`} type="button" aria-pressed={palette === name} onClick={() => setPalette(name)} key={name}><span className="id-palette-name">{name}</span></button>)}</div></fieldset><label className="id-config-section"><span className="id-config-label">YOUR DIRECTION</span><textarea className="create-input" value={prompt} maxLength={1600} placeholder={config.prompt} onChange={(event) => setPrompt(event.target.value)} /></label><div className="id-generate-wrap"><button className="id-generate-btn" type="button" disabled={!file || status === "generating"} onClick={() => void generate()}>{status === "generating" ? "GENERATING YOUR CONCEPT…" : status === "complete" ? "GENERATE ANOTHER CONCEPT →" : `Generate ${config.title} →`}</button><span className="id-generate-tooltip">{status === "generating" ? "This can take up to a minute. Keep this page open." : "Upload a photo → Select options → Generate"}</span>{error && <p className="id-generation-error" role="alert">{error}</p>}</div></div></div></div></section>;
}

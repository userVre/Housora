"use client";

import Image from "next/image";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAnalytics } from "@/components/privacy/AnalyticsProvider";

export function ProjectsGrid() {
  const projects = useQuery(api.projects.listProjects);
  const remove = useMutation(api.projects.deleteProject);
  const { capture } = useAnalytics();
  if (projects === undefined) return <div className="projects-empty"><h2>Loading projects…</h2><p>Your private workspace is connecting securely.</p></div>;
  if (!projects.length) return <div className="projects-empty"><h2>No projects yet</h2><p>Choose an AI tool and save your first generated design here.</p><Link href="/design" className="projects-new-btn">Choose a tool</Link></div>;
  return <div className="projects-grid">{projects.map((project) => <article className="project-card" key={project._id}><Link href="/design" onClick={() => capture("project_opened")}><div className="project-card-image">{project.afterImageUrl || project.beforeImageUrl ? <Image src={project.afterImageUrl || project.beforeImageUrl || ""} alt="" fill sizes="(max-width: 700px) 100vw, 33vw" unoptimized /> : <span className="workspace-tool-placeholder">◇</span>}</div><div className="project-card-copy"><h2>{project.title}</h2><p>{project.roomType} · {project.style}</p></div></Link><button type="button" className="project-delete-btn" onClick={() => { if (window.confirm(`Delete ${project.title}? This cannot be undone.`)) void remove({ projectId: project._id }).then(() => capture("project_deleted")); }}>Delete</button></article>)}</div>;
}

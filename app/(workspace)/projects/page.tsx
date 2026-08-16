import Link from "next/link";
import { SiteShell } from "@/components/layout/SiteShell";
import { ProjectsGrid } from "@/components/workspace/ProjectsGrid";
export default function ProjectsPage() { return <SiteShell workspace><section className="projects-page"><div className="projects-content"><div className="projects-header"><div><h1>My Projects</h1><p>Keep your design ideas together and return whenever you like.</p></div><Link href="/design" className="projects-new-btn">Choose a tool</Link></div><ProjectsGrid /></div></section></SiteShell>; }

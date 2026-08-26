import { notFound } from "next/navigation";
import { getProjectBySlug, getPublishedProjects } from "@/lib/projects";
import { ProjectDetail } from "@/components/ProjectDetail";

export function generateStaticParams() {
  return getPublishedProjects().map((project) => ({ slug: project.slug }));
}

export default async function ProjectPage({ params }: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project || !project.published) return notFound();

  return <ProjectDetail project={project} />;
}

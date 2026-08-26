import { notFound } from "next/navigation";
import { getProjectBySlug, getPublishedProjects } from "@/lib/projects";
import { ProjectDetail } from "@/components/ProjectDetail";
import { DetailModal } from "@/components/DetailModal";

// 攔截從首頁「/」點擊連到 /projects/[slug] 的 client-side 導覽，改成蓋一層彈出視窗
// （見 DetailModal.tsx），首頁本身維持掛載在背景。直接訪問／分享網址／重新整理這個網址
// 不會走到這裡——會落到真正的 src/app/projects/[slug]/page.tsx，顯示完整獨立頁面。
export function generateStaticParams() {
  return getPublishedProjects().map((project) => ({ slug: project.slug }));
}

export default async function InterceptedProjectModal({ params }: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project || !project.published) return notFound();

  return (
    <DetailModal>
      <ProjectDetail project={project} variant="modal" />
    </DetailModal>
  );
}

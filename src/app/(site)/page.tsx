import { getPublishedProjects } from "@/lib/projects";
import { SplitExhibition } from "@/components/SplitExhibition";

export default function Home() {
  const items = getPublishedProjects();
  const [a, b] = items;

  if (!a || !b) return null;

  return <SplitExhibition projects={[a, b]} />;
}

import { EdgeTitle } from "@/components/EdgeTitle";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative h-[100dvh] overflow-hidden">
      <EdgeTitle />
      <main className="h-full overflow-hidden pt-[18px] pr-[18px] pl-[18px] sm:pt-[30px] sm:pr-[30px] sm:pl-[30px]">
        {children}
      </main>
      <ThemeToggle />
    </div>
  );
}

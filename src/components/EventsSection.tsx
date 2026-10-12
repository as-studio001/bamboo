import { exhibitionEvents } from "@/lib/events";
import { TEXT_PRIMARY } from "@/components/theme";

// 「活動」區塊：整個展覽共用一份內容（content/events.json，見 lib/events.ts），兩種擺法——
// - variant="screen"：首頁最尾端、接在兩欄展覽後面的第三個滿版畫面（整頁 scroll-snap 的一屏），
//   版面跟「策展宣言」同一套非對稱靠左的純文字排法，不用任何一案的照片（同樣避免偏袒觀感）
// - variant="inline"：案例內頁（獨立頁面／彈出視窗）最尾端、基地地圖後面，排法跟「基地」標題一致
// 內容還沒填的時候只顯示一句「活動資訊即將公布」。
export function EventsSection({ variant, id }: { variant: "screen" | "inline"; id: string }) {
  const { title, text } = exhibitionEvents;
  const paragraphs = (text || "").split(/\n\n+/).map((p) => p.trim()).filter(Boolean);

  const body = paragraphs.length ? (
    paragraphs.map((p, i) => (
      <p key={i} className="mt-4 max-w-xl text-sm leading-relaxed whitespace-pre-line sm:text-base">
        {p}
      </p>
    ))
  ) : (
    <p className="mt-4 text-sm sm:text-base" style={{ color: "var(--foreground-muted)" }}>
      活動資訊即將公布
    </p>
  );

  if (variant === "inline") {
    return (
      <div id={id} className="mt-16 scroll-mt-10 border-t pt-10 sm:mt-20 sm:pt-14" style={{ borderColor: "var(--border-subtle)" }}>
        <h3 className={`font-serif-tc text-lg font-bold tracking-wide uppercase sm:text-xl ${TEXT_PRIMARY}`}>{title}</h3>
        {body}
      </div>
    );
  }

  return (
    <section
      id={id}
      className="flex min-h-[100dvh] w-full shrink-0 snap-start flex-col justify-center bg-[var(--background)] px-6 py-20 text-[var(--foreground)] sm:px-12 lg:px-20"
    >
      <p className="font-mono text-[10px] tracking-[0.25em] uppercase sm:text-xs" style={{ color: "var(--foreground-muted)" }}>
        Events
      </p>
      <h2 className="mt-6 font-serif-tc text-2xl font-medium sm:mt-8 sm:text-3xl lg:text-[2.35rem]">{title}</h2>
      {body}
    </section>
  );
}

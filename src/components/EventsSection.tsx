import { exhibitionEvents, type EventPoster } from "@/lib/events";
import { TEXT_PRIMARY } from "@/components/theme";

// 「活動」區塊：整個展覽共用一份內容（content/events.json，見 lib/events.ts），兩種擺法——
// - variant="screen"：首頁最尾端、接在兩欄展覽後面的第三個滿版畫面（整頁 scroll-snap 的一屏），
//   版面跟「策展宣言」同一套非對稱靠左的排法；有海報時大螢幕左文右圖，小螢幕文字在上、海報在下
// - variant="inline"：案例內頁（獨立頁面／彈出視窗）最尾端、基地地圖後面，排法跟「基地」標題一致
// 文字跟海報都還沒填的時候只顯示一句「活動資訊即將公布」。
export function EventsSection({ variant, id }: { variant: "screen" | "inline"; id: string }) {
  const { title, text } = exhibitionEvents;
  const posters = (exhibitionEvents.posters || []).filter((p) => p.src);
  const paragraphs = (text || "").split(/\n\n+/).map((p) => p.trim()).filter(Boolean);

  const body = paragraphs.length ? (
    paragraphs.map((p, i) => (
      <p key={i} className="mt-4 max-w-xl text-sm leading-relaxed break-words whitespace-pre-line sm:text-base">
        {linkify(p)}
      </p>
    ))
  ) : posters.length ? null : (
    <p className="mt-4 text-sm sm:text-base" style={{ color: "var(--foreground-muted)" }}>
      活動資訊即將公布
    </p>
  );

  if (variant === "inline") {
    return (
      <div id={id} className="mt-16 scroll-mt-10 border-t pt-10 sm:mt-20 sm:pt-14" style={{ borderColor: "var(--border-subtle)" }}>
        <h3 className={`font-serif-tc text-lg font-bold tracking-wide uppercase sm:text-xl ${TEXT_PRIMARY}`}>{title}</h3>
        {posters.length > 0 && <Posters posters={posters} className="mt-6" imgClassName="max-h-[70vh]" />}
        {body}
      </div>
    );
  }

  return (
    <section
      id={id}
      className="flex min-h-[100dvh] w-full shrink-0 snap-start flex-col justify-center bg-[var(--background)] px-6 py-20 text-[var(--foreground)] sm:px-12 lg:px-20"
    >
      <div className={posters.length ? "grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:gap-16" : ""}>
        <div>
          <p className="font-mono text-[10px] tracking-[0.25em] uppercase sm:text-xs" style={{ color: "var(--foreground-muted)" }}>
            Events
          </p>
          <h2 className="mt-6 font-serif-tc text-2xl font-medium sm:mt-8 sm:text-3xl lg:text-[2.35rem]">{title}</h2>
          {body}
        </div>
        {posters.length > 0 && <Posters posters={posters} imgClassName="max-h-[60vh] lg:max-h-[80vh]" />}
      </div>
    </section>
  );
}

// 內文裡的網址（例如報名表單）自動變成可點的連結，另開分頁；長網址用 break-all 換行，不撐破版面。
function linkify(text: string) {
  return text.split(/(https?:\/\/[^\s]+)/g).map((part, i) =>
    /^https?:\/\//.test(part) ? (
      <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="break-all underline underline-offset-4">
        {part}
      </a>
    ) : (
      part
    ),
  );
}

// 海報一律用原生比例顯示（不裁切）——海報本身的文字資訊被裁掉就失去意義。多張時並排、放不下就換行。
function Posters({ posters, className = "", imgClassName = "" }: { posters: EventPoster[]; className?: string; imgClassName?: string }) {
  return (
    <div className={`flex flex-wrap items-end gap-4 sm:gap-6 ${className}`}>
      {posters.map((p) => (
        <figure key={p.id} className="min-w-0 max-w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.src} alt={p.caption || "活動海報"} className={`h-auto w-auto max-w-full shadow-sm ${imgClassName}`} />
          {p.caption && (
            <figcaption className="mt-2 text-xs" style={{ color: "var(--foreground-muted)" }}>
              {p.caption}
            </figcaption>
          )}
        </figure>
      ))}
    </div>
  );
}

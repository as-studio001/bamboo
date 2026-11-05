import { exhibitionEvents, type EventLecture, type EventPerson, type EventPoster } from "@/lib/events";
import { chapterLabel } from "@/lib/chapters";
import { EventsSlider } from "@/components/EventsSlider";
import { PartnerCatalog } from "@/components/PartnerCatalog";
import { TEXT_PRIMARY } from "@/components/theme";
import { partnerGroups, type PartnerGroup } from "@/lib/partners";

// 「活動」區塊：整個展覽共用一份內容（content/events.json，見 lib/events.ts），兩種擺法——
// - variant="screen"：首頁最尾端、接在兩欄展覽後面的第三個滿版畫面（整頁 scroll-snap 的一屏），
//   版面跟「策展宣言」同一套非對稱靠左的排法；有海報時大螢幕左文右圖，小螢幕文字在上、海報在下
// - variant="inline"：案例內頁（獨立頁面／彈出視窗）最尾端、基地地圖後面，排法跟「基地」標題一致
// 文字跟海報都還沒填的時候只顯示一句「活動資訊即將公布」。
export function EventsSection({ variant, id }: { variant: "screen" | "inline"; id: string }) {
  const { text } = exhibitionEvents;
  const title = chapterLabel("events");
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

  // （2026-10-20）網頁最尾端加上單位 LOGO 列：活動內容在上方置中，LOGO 列貼齊畫面底部，海報高度扣掉 LOGO 列，一個畫面放得下
  const hasPartners = partnerGroups.some((g) => g.items.length);
  // （2026-11-05）有場次資料時，這個畫面可以往右滑：第一頁總覽，之後每場一頁（見 EventsSlider、LecturePanel）；
  // 上方多一列分頁，海報高度再扣掉那一列
  const lectures = exhibitionEvents.lectures ?? [];
  const sliding = lectures.length > 0;
  const posterHeight = sliding
    ? "max-h-[60vh] lg:max-h-[calc(100dvh-340px)] short:max-h-[calc(100dvh-90px)]"
    : hasPartners
      ? "max-h-[60vh] lg:max-h-[calc(100dvh-300px)]"
      : "max-h-[60vh] lg:max-h-[80vh]";
  const overview = (
    <div className={posters.length ? "grid h-full items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:gap-16 short:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] short:items-start short:gap-8" : ""}>
      <div>
        <p className="font-mono text-[10px] tracking-[0.25em] uppercase sm:text-xs" style={{ color: "var(--foreground-muted)" }}>
          Events
        </p>
        <h2 className="mt-6 font-serif-tc text-2xl font-medium sm:mt-8 sm:text-3xl lg:text-[2.35rem] short:mt-2 short:text-2xl">{title}</h2>
        {body}
      </div>
      {posters.length > 0 && <Posters posters={posters} imgClassName={posterHeight} />}
    </div>
  );
  return (
    <section
      id={id}
      className="flex min-h-[100dvh] w-full shrink-0 snap-start flex-col bg-[var(--background)] px-6 pt-20 pb-10 text-[var(--foreground)] sm:px-12 sm:pt-16 sm:pb-8 lg:px-20 short:pt-5"
    >
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        {sliding ? (
          <EventsSlider labels={["總覽", ...lectures.map((l) => l.tab)]}>
            {overview}
            {lectures.map((l) => (
              <LecturePanel key={l.id} lecture={l} posterHeight={posterHeight} />
            ))}
          </EventsSlider>
        ) : (
          overview
        )}
      </div>
      {hasPartners && <Partners />}
    </section>
  );
}

// 單場講座一頁：跟總覽同一套左文右圖。海報可點開看原圖（邀請函上的小字在頁面上看不清楚）。
function LecturePanel({ lecture: l, posterHeight }: { lecture: EventLecture; posterHeight: string }) {
  const { venue, venueAddress, signupUrl } = exhibitionEvents;
  const muted = { color: "var(--foreground-muted)" };
  const slides = (l.slides ?? []).filter((s) => s.url);
  const row = "grid grid-cols-[3.5rem_minmax(0,1fr)] gap-x-3";
  const label = "pt-0.5 font-serif-tc text-sm";
  const people = (list: EventPerson[]) => (
    <ul className="space-y-1">
      {list.map((p) => (
        <li key={p.name} className="font-serif-tc text-sm leading-relaxed sm:text-[15px]">
          <span className={`font-bold ${TEXT_PRIMARY}`}>{p.name}</span>
          {p.role && (
            <span className="block text-xs sm:ml-2 sm:inline sm:text-sm" style={muted}>
              {p.role}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
  return (
    <div className="grid h-full items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:gap-16 short:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] short:items-start">
      <div className="min-w-0">
        {l.label && (
          <p className="font-mono text-[10px] tracking-[0.25em] uppercase sm:text-xs" style={muted}>
            {l.label}
          </p>
        )}
        <p className={`mt-3 font-serif-tc text-3xl font-bold sm:text-4xl ${TEXT_PRIMARY}`}>
          {l.date}
          {l.weekday && <span className="ml-3 text-xl sm:text-2xl">{l.weekday}</span>}
          {l.time && <span className="ml-3 text-base font-medium sm:text-lg">{l.time}</span>}
        </p>
        {l.theme && (
          <p className="mt-3 font-serif-tc text-sm" style={muted}>
            {l.theme}
          </p>
        )}
        <h3 className={`mt-1 font-serif-tc text-xl leading-snug font-bold sm:text-2xl ${TEXT_PRIMARY}`}>{l.title}</h3>
        {l.text && <p className="mt-3 text-sm leading-relaxed whitespace-pre-line sm:font-serif-tc sm:text-[15px]">{l.text}</p>}

        <div className="mt-4 space-y-3 border-t pt-4" style={{ borderColor: "var(--border-subtle)" }}>
          {!!l.speakers?.length && (
            <div className={row}>
              <p className={label} style={muted}>
                講者
              </p>
              {people(l.speakers)}
            </div>
          )}
          {!!l.hosts?.length && (
            <div className={row}>
              <p className={label} style={muted}>
                主持
              </p>
              {people(l.hosts)}
            </div>
          )}
          {venue && (
            <div className={row}>
              <p className={label} style={muted}>
                地點
              </p>
              <p className="font-serif-tc text-sm leading-relaxed sm:text-[15px]">
                <span className={`font-bold ${TEXT_PRIMARY}`}>{venue}</span>
                {venueAddress && (
                  <span className="ml-2 text-xs sm:text-sm" style={muted}>
                    {venueAddress}
                  </span>
                )}
              </p>
            </div>
          )}
          <div className={row}>
            <p className={label} style={muted}>
              簡報
            </p>
            {slides.length ? (
              <ul className="space-y-1">
                {slides.map((s) => (
                  <li key={s.url} className="font-serif-tc text-sm leading-relaxed sm:text-[15px]">
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className={`underline underline-offset-4 ${TEXT_PRIMARY}`}>
                      {s.title}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="pt-0.5 font-serif-tc text-sm" style={muted}>
                講者簡報將陸續提供
              </p>
            )}
          </div>
        </div>

        {signupUrl && (
          <a
            href={signupUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`mt-5 inline-block border px-4 py-2 font-serif-tc text-sm font-bold transition-opacity hover:opacity-60 ${TEXT_PRIMARY}`}
            style={{ borderColor: "currentColor" }}
          >
            免費參加・線上報名 →
          </a>
        )}
      </div>
      {l.poster && (
        <a href={l.poster} target="_blank" rel="noopener noreferrer" aria-label={`開啟${l.tab}邀請函`} className="block w-fit max-w-full transition-opacity hover:opacity-85">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={l.poster} alt={`${l.tab}邀請函：${l.title}`} loading="lazy" className={`h-auto w-auto max-w-full shadow-sm ${posterHeight}`} />
        </a>
      )}
    </div>
  );
}

// 單位 LOGO 列：主辦／承辦／參加團隊左右排開，每組上面一個小標；LOGO 統一高度，有網址就連到該單位官網（另開分頁）。
// 還沒有 LOGO 的單位先用名稱文字佔位。
// （2026-10-20）案例內頁（獨立頁面／彈出視窗）最尾端也共用這一列，見 ProjectDetail.tsx；
// （2026-10-28）案例內頁改傳 groups＝該案自己的單位（project.credits），不再顯示整個展覽共用的那一列。
export function Partners({ className = "mt-12 sm:mt-10", groups = partnerGroups }: { className?: string; groups?: PartnerGroup[] }) {
  if (!groups.some((g) => g.items.length)) return null;
  return (
    <footer className={`border-t pt-6 ${className}`} style={{ borderColor: "var(--border-subtle)" }}>
      {/* （2026-11-05）整列置中；每組的小標放在 LOGO 的左上角（靠左對齊第一個 LOGO） */}
      <div className="flex flex-wrap justify-center gap-x-14 gap-y-6 lg:gap-x-20">
        {groups
          .filter((g) => g.items.length)
          .map((g) => (
            <div key={g.label}>
              <p className="font-serif-tc text-xs font-bold tracking-wide" style={{ color: "var(--foreground-muted)" }}>
                {g.label}
              </p>
              <ul className="mt-3 flex flex-wrap items-center gap-x-8 gap-y-3">
                {g.items.map((p) => {
                  const inner = p.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.logo} alt={p.name} title={p.name} className="block h-9 w-auto max-w-[220px] object-contain sm:h-10" />
                  ) : (
                    // 還沒有 LOGO 的單位用名稱文字（2026-10-28 放大一級，跟旁邊 LOGO 的份量比較接近）
                    <span className={`block font-serif-tc text-lg font-bold leading-10 sm:text-xl ${TEXT_PRIMARY}`}>{p.name}</span>
                  );
                  return (
                    <li key={p.name}>
                      {p.catalog ? (
                        <PartnerCatalog name={p.name} url={p.url} catalog={p.catalog}>
                          {inner}
                        </PartnerCatalog>
                      ) : p.url ? (
                        <a href={p.url} target="_blank" rel="noopener noreferrer" aria-label={p.name} className="block transition-opacity hover:opacity-70">
                          {inner}
                        </a>
                      ) : (
                        inner
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
      </div>
    </footer>
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

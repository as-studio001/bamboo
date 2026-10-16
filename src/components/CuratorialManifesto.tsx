"use client";

import { Fragment } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { manifesto } from "@/lib/manifesto";

// 首頁最上面的「策展宣言」，點進網站先看到這裡，往下捲完才進到兩欄並列的展覽（SplitExhibition）。
// 這一段不屬於任何一個建築案，是整個展覽層級的論述，跟 project.intro（各案自己的簡介）分開。
//
// （2026-10-15）從單一畫面改成五個連續的滿版畫面，像一本書的序章，內容整理自策展簡報：
//   01 封面：計畫名稱、一句話、策展人與展覽構成
//   02 一句話主張：「我們希望把竹構，變成一套零件系統。」＋ NOT／NOT／BUT
//   03 核心公式：A ＋ B ＝ ？
//   04 數字與竹構生成鏈
//   05 結語：系統提供可能，業主決定結果
//   06 兩案預告：原本單頁宣言的三個面向＋兩案手稿，銜接下面的兩欄展覽（見 BridgeScreen）
// 每一屏都是 100dvh、snap-start，沿用 (site)/layout.tsx main 的整頁吸附，捲一次換一屏。
// 視覺沿用網站本身的語彙（襯線字、灰階、細線），不搬簡報的色塊；只有「？」用竹棕色點一下，
// 讓「答案未定」成為整段唯一的重點色。
// 每一屏底部是細線＋頁碼（01 / 05 · 英文小標），右側「略過宣言」直接跳到兩欄展覽，不想讀的人
// 不用捲五次。
// 手機版：每屏最少一個畫面高，內容放不下時可以在那一屏裡繼續往下捲。
//
// 文字內容存在 content/manifesto.json（見 lib/manifesto.ts），由後台 /admin 的「策展宣言」編輯；
// 文字裡的換行用 whitespace-pre-line 保留，留空的欄位不顯示。第一屏的 id="manifesto" 是給兩側
// 直書標題（EdgeTitle）點擊時捲回這裡用的。

const ACCENT = "#b4541f"; // 竹棕色，只用在「？」
const MUTED = { color: "var(--foreground-muted)" };
const RULE = "border-[var(--border-subtle)]";
const EYEBROW = "font-mono text-[10px] tracking-[0.25em] uppercase sm:text-xs";

function scrollToExhibition() {
  document.getElementById("exhibition")?.scrollIntoView({ behavior: "smooth" });
}

// 進到畫面時淡入上移（全站動效原則：20px／0.7s），每次回到這一屏都重播
function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ amount: 0.3 }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function Screen({
  id,
  index,
  total,
  label,
  children,
  image,
  figure,
}: {
  id?: string;
  index: number;
  total: number;
  label?: string;
  children: React.ReactNode;
  // （2026-10-16）滿版背景照片（目前只有第一屏用，後台「封面背景照片」）：照片鋪滿整屏、上面一層由下往上
  // 變深的遮罩，字改成米白（.paper-dark）
  image?: string;
  // （2026-10-16）右下角主視覺（去背圖），參考海報構圖：竹剖面貼齊畫面右緣、一部分超出畫面，放在文字後面
  figure?: string;
}) {
  const last = index === total - 1;
  return (
    <section
      id={id}
      className={`paper ${image ? "paper-dark" : ""} relative flex min-h-[100dvh] w-full shrink-0 snap-start flex-col overflow-hidden px-6 pt-16 text-[var(--foreground)] sm:h-[100dvh] sm:min-h-0 sm:px-16 sm:pt-[8vh] lg:px-24`}
    >
      {image && (
        <>
          <Image src={image} alt="" fill priority sizes="100vw" className="object-cover" />
          <div
            aria-hidden
            className="absolute inset-0"
            style={{ background: "linear-gradient(to top, rgb(20 16 12 / 0.78) 0%, rgb(20 16 12 / 0.45) 45%, rgb(20 16 12 / 0.25) 100%)" }}
          />
        </>
      )}
      {figure && !image && (
        <motion.div
          aria-hidden
          // （2026-10-16）稍微半透明（0.8），像印在紙上，不跟大標搶（同日由 0.6 調高）
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 0.8, x: 0 }}
          transition={{ duration: 1.1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          // z-10：疊在參與者表格上方那條細線上面（細線不穿過竹剖面）；文字本身不會跟竹剖面重疊
          className="pointer-events-none absolute right-0 bottom-[8vh] z-10 hidden aspect-[460/600] sm:block"
          // （同日）縮小一點、往下放：底緣貼著頁尾細線上方，上緣大約在大標的高度
          style={{ width: "min(32vw, 54vh)", filter: "drop-shadow(0 18px 30px rgb(60 45 25 / 0.12))" }}
        >
          <Image src={figure} alt="" fill priority sizes="32vw" className="object-contain object-right" />
        </motion.div>
      )}
      <div className="relative flex flex-1 flex-col justify-center">{children}</div>
      <div className={`relative mt-10 flex items-center justify-between border-t ${RULE} py-5 sm:mt-0 sm:py-6`}>
        <p className={EYEBROW} style={MUTED}>
          {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          {label ? ` · ${label}` : ""}
        </p>
        <button
          onClick={scrollToExhibition}
          className={`${EYEBROW} link-underline transition-opacity hover:opacity-100`}
          style={MUTED}
        >
          {last ? "進入展覽 ↓" : "略過宣言 →"}
        </button>
      </div>
      {index === 0 && (
        // 第一屏底部中間的捲動提示：緩慢上下浮動，提示「往下還有」
        <motion.span
          aria-hidden
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          className="pointer-events-none absolute bottom-6 left-1/2 hidden -translate-x-1/2 sm:block"
          style={MUTED}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 4v16M6 14l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.span>
      )}
    </section>
  );
}

// （2026-10-16）大標裡的「竹構」／「竹」換成竹棕色（第一屏「常民竹小屋實驗計畫」的竹、第二屏的「竹構」），
// 跟「？」、BUT 區塊同一個重點色
// （同日）words 可指定要上色的詞（第四屏「系統」、第五屏「業主」、第六屏「竹構」），預設是竹構／竹
function BambooAccent({ text, words = ["竹構", "竹"] }: { text: string; words?: string[] }) {
  const re = new RegExp(`(${words.join("|")})`);
  return (
    <>
      {text.split(re).map((part, i) =>
        words.includes(part) ? (
          <span key={i} style={{ color: ACCENT }}>
            {part}
          </span>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}

// 文字裡的「？」／「?」換成竹棕色
function Accented({ text }: { text: string }) {
  return (
    <>
      {text.split(/([?？])/).map((part, i) =>
        /[?？]/.test(part) ? (
          <span key={i} style={{ color: ACCENT }}>
            {part}
          </span>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}

// 第六屏「兩案預告」需要的案例資料（首頁 page.tsx 從 getPublishedProjects 取左右兩案傳進來）
export type BridgeProject = {
  slug: string;
  name: string;
  meta: string; // 地點 · 年份 · 類型
  sketch?: string; // 手稿圖片網址（各案後台 sketchImages 的第一張）
  cover?: string; // （2026-10-16）首頁封面照片：手稿淡出後換成這張，接到下一屏兩欄的同一張封面
};

export function CuratorialManifesto({ projects }: { projects?: [BridgeProject, BridgeProject] }) {
  const { eyebrow, cover, statement, formula, counts, closing, bridge } = manifesto;
  const screens = [
    cover && { key: "cover", label: cover.label, body: <CoverScreen eyebrow={eyebrow} data={cover} /> },
    statement && { key: "statement", label: statement.label, body: <StatementScreen data={statement} /> },
    formula && { key: "formula", label: formula.label, body: <FormulaScreen data={formula} /> },
    counts && { key: "counts", label: counts.label, body: <CountsScreen data={counts} /> },
    closing && { key: "closing", label: closing.label, body: <ClosingScreen data={closing} /> },
    bridge &&
      projects && { key: "bridge", label: bridge.label, body: <BridgeScreen data={bridge} projects={projects} /> },
  ].filter((s): s is { key: string; label: string | undefined; body: React.ReactElement } => !!s);

  return (
    <>
      {screens.map((s, i) => (
        <Screen
          key={s.key}
          id={i === 0 ? "manifesto" : undefined}
          index={i}
          total={screens.length}
          label={s.label}
          image={s.key === "cover" ? cover?.image : undefined}
          figure={s.key === "cover" ? cover?.figure : undefined}
        >
          {s.body}
        </Screen>
      ))}
    </>
  );
}

// 一行一項的文字拆成 { label, value }：「計畫發起人｜財團法人…」→ 標籤「計畫發起人」、內容「財團法人…」
function lines(text?: string) {
  return (text ?? "")
    .split("\n")
    .filter((l) => l.trim())
    .map((l) => {
      const at = l.indexOf("｜");
      return at < 0 ? { label: "", value: l.trim() } : { label: l.slice(0, at).trim(), value: l.slice(at + 1).trim() };
    });
}

function CoverScreen({ eyebrow, data }: { eyebrow?: string; data: NonNullable<typeof manifesto.cover> }) {
  return (
    <>
      <Reveal>
        {eyebrow && (
          <p className={EYEBROW} style={MUTED}>
            {eyebrow}
          </p>
        )}
        {data.title && (
          <h1 className="mt-6 font-serif-tc text-4xl leading-[1.25] font-semibold sm:mt-8 sm:text-6xl lg:text-7xl">
            <BambooAccent text={data.title} />
          </h1>
        )}
        {data.subtitle && (
          <p className="mt-3 font-serif-tc text-xl italic sm:mt-4 sm:text-3xl" style={MUTED}>
            {data.subtitle}
          </p>
        )}
        {data.tagline && (
          <p className="mt-8 max-w-4xl font-serif-tc text-lg leading-[1.7] sm:mt-12 sm:text-2xl">{data.tagline}</p>
        )}
      </Reveal>
      {(data.credit || data.notes) && (
        <Reveal
          delay={0.15}
          // 有右下角主視覺（竹剖面）時，細線停在竹剖面左邊 48px，不穿過竹子（主視覺寬度見 Screen 的 FIGURE_WIDTH）
          className={`mt-10 border-t ${RULE} pt-6 sm:mt-[7vh] sm:pt-8 ${
            data.figure && !data.image ? "sm:max-w-[calc(100vw-min(32vw,54vh)-4rem-48px)] lg:max-w-[calc(100vw-min(32vw,54vh)-6rem-48px)]" : ""
          }`}
        >
          {/* （2026-10-15）參與者（credit）跟補充說明（notes）都是一行一項、用「｜」分成標籤跟內容，排成同一張
              兩欄表：標籤一律灰色、內容一律粗體（同日改：補充說明的內容也用粗體）。沒有「｜」的行整行跨兩欄。 */}
          <dl className="grid grid-cols-[auto_1fr] items-baseline gap-x-8 gap-y-2 sm:gap-x-12">
            {[...lines(data.credit), ...lines(data.notes)].map((l) => ({ ...l, strong: true })).map((l, i) =>
              l.label ? (
                <Fragment key={i}>
                  <dt className="font-serif-tc text-sm leading-[1.9] sm:text-base" style={MUTED}>
                    {l.label}
                  </dt>
                  <dd
                    className={`font-serif-tc text-sm leading-[1.9] sm:text-base ${l.strong ? "font-semibold sm:text-lg" : ""}`}
                    style={l.strong ? undefined : MUTED}
                  >
                    {l.value}
                  </dd>
                </Fragment>
              ) : (
                <dd
                  key={i}
                  className={`col-span-2 font-serif-tc text-sm leading-[1.9] sm:text-base ${l.strong ? "font-semibold sm:text-lg" : ""}`}
                  style={l.strong ? undefined : MUTED}
                >
                  {l.value}
                </dd>
              ),
            )}
          </dl>
        </Reveal>
      )}
    </>
  );
}

function StatementScreen({ data }: { data: NonNullable<typeof manifesto.statement> }) {
  const contrasts = data.contrasts ?? [];
  return (
    <>
      <Reveal>
        {data.title && (
          <h2 className="font-serif-tc text-3xl leading-[1.35] font-semibold whitespace-pre-line sm:text-5xl lg:text-6xl">
            <BambooAccent text={data.title} />
          </h2>
        )}
        {data.body && (
          <p className="mt-8 max-w-4xl text-sm leading-[1.95] whitespace-pre-line sm:mt-10 sm:font-serif-tc sm:text-lg" style={MUTED}>
            {data.body}
          </p>
        )}
      </Reveal>
      {contrasts.length > 0 && (
        <Reveal delay={0.15} className="mt-10 grid gap-3 sm:mt-[7vh] sm:grid-cols-3 sm:gap-5">
          {contrasts.map((c, i) => {
            const answer = i === contrasts.length - 1;
            return (
              <div
                key={i}
                // （2026-10-16）最後一格（BUT）用竹棕色實底＋米白字凸顯，跟「竹」「？」同一個重點色
                className={`border px-5 py-5 sm:px-6 sm:py-6 ${answer ? "border-transparent shadow-[0_10px_30px_rgb(120_60_20/0.18)]" : RULE}`}
                style={answer ? { backgroundColor: ACCENT, color: "#f7f3ec" } : undefined}
              >
                <p className={EYEBROW} style={answer ? { color: "rgb(247 243 236 / 0.8)" } : MUTED}>
                  {c.label}
                </p>
                <p
                  className={`mt-3 font-serif-tc text-lg sm:text-xl ${answer ? "font-semibold sm:text-2xl" : ""}`}
                  style={answer ? undefined : MUTED}
                >
                  {c.text}
                </p>
              </div>
            );
          })}
        </Reveal>
      )}
    </>
  );
}

function FormulaScreen({ data }: { data: NonNullable<typeof manifesto.formula> }) {
  const terms = data.terms ?? [];
  return (
    <>
      {terms.length > 0 && (
        <Reveal>
          {/* A ＋ B ＝ ？：前面幾項用「＋」接，最後一項用「＝」接 */}
          <p className="text-center font-serif-tc text-6xl leading-none font-semibold sm:text-8xl lg:text-9xl">
            {terms.map((t, i) => (
              <Fragment key={i}>
                {i > 0 && (
                  <span className="mx-[0.3em] font-normal" style={MUTED}>
                    {i === terms.length - 1 ? "=" : "+"}
                  </span>
                )}
                <Accented text={t.symbol} />
              </Fragment>
            ))}
          </p>
        </Reveal>
      )}
      {terms.length > 0 && (
        <Reveal delay={0.15} className={`mt-12 grid gap-8 sm:mt-[9vh] sm:grid-cols-3 sm:gap-0`}>
          {terms.map((t, i) => (
            <div key={i} className={i > 0 ? `sm:border-l sm:px-8 lg:px-10 ${RULE}` : "sm:pr-8 lg:pr-10"}>
              <p className="font-serif-tc text-3xl font-semibold sm:text-4xl">
                <Accented text={t.symbol} />
              </p>
              <p className="mt-4 font-serif-tc text-lg font-semibold sm:text-xl">{t.title}</p>
              {t.subtitle && <p className="mt-1 font-serif-tc text-base sm:text-lg">{t.subtitle}</p>}
              {t.en && (
                <p className={`mt-3 ${EYEBROW}`} style={MUTED}>
                  {t.en}
                </p>
              )}
            </div>
          ))}
        </Reveal>
      )}
      {data.note && (
        <Reveal delay={0.3}>
          <p className="mt-12 font-serif-tc text-base leading-[1.8] sm:mt-[9vh] sm:text-xl">
            <Accented text={data.note} />
          </p>
        </Reveal>
      )}
    </>
  );
}

function CountsScreen({ data }: { data: NonNullable<typeof manifesto.counts> }) {
  const items = data.items ?? [];
  const chain = data.chain ?? [];
  return (
    <>
      <Reveal>
        {data.title && (
          <h2 className="font-serif-tc text-3xl leading-[1.35] font-semibold sm:text-5xl">
            <BambooAccent text={data.title} words={["系統"]} />
          </h2>
        )}
        {data.body && (
          <p className="mt-5 max-w-4xl text-sm leading-[1.95] sm:font-serif-tc sm:text-lg" style={MUTED}>
            {data.body}
          </p>
        )}
      </Reveal>
      {items.length > 0 && (
        <Reveal delay={0.15} className="mt-10 grid grid-cols-2 gap-y-8 sm:mt-[7vh] sm:grid-cols-4 sm:gap-0">
          {items.map((it, i) => (
            <div key={i} className={i > 0 ? `pr-4 sm:border-l sm:px-8 ${RULE}` : "pr-4 sm:pr-8"}>
              {it.en && (
                <p className={EYEBROW} style={MUTED}>
                  {it.en}
                </p>
              )}
              <p className="mt-2 font-serif-tc text-6xl leading-none font-semibold sm:mt-3 sm:text-[clamp(3.5rem,11vh,6.5rem)]">
                {it.value}
              </p>
              <p className="mt-3 font-serif-tc text-base sm:text-lg">{it.label}</p>
            </div>
          ))}
        </Reveal>
      )}
      {chain.length > 0 && (
        <Reveal delay={0.3} className="mt-12 sm:mt-[8vh]">
          {data.chainLabel && (
            <p className={EYEBROW} style={MUTED}>
              {data.chainLabel}
            </p>
          )}
          {/* 竹構生成鏈：一條細線串起各步驟，頭（原料）尾（使用）兩個點加大 */}
          <div className="relative mt-5 sm:mt-6">
            <div className={`absolute top-[5px] right-[6px] left-[6px] border-t ${RULE}`} />
            <ol className="relative flex justify-between">
              {chain.map((step, i) => {
                const end = i === 0 || i === chain.length - 1;
                return (
                  <li key={i} className={`flex flex-col ${i === 0 ? "items-start" : i === chain.length - 1 ? "items-end" : "items-center"}`}>
                    <span
                      className={`block rounded-full bg-[var(--foreground)] ${end ? "size-3" : "mt-[2px] size-2 opacity-60"}`}
                    />
                    <span className={`mt-3 font-serif-tc text-xs sm:text-base ${end ? "font-semibold" : ""}`}>{step}</span>
                  </li>
                );
              })}
            </ol>
          </div>
        </Reveal>
      )}
    </>
  );
}

// 第六屏「兩案預告」：理念到作品的過渡。
// - 上半部：標題＋原本單頁宣言的三個面向（☉，排成一行）＋兩句引言
// - 中間一條細線，線上小字「兩組實驗場域」
// - 下半部左右對分，跟下一屏的兩欄展覽同一個分界（左右各 50%、中間不留空），各放手稿、案名、
//   地點年份類型、一句簡介。往下捲就是兩案的滿版封面，同一個左右位置從手稿變成實體照片。
// 手稿完整顯示不裁切（object-contain），用 mix-blend-multiply 讓掃描紙張的淺色底融進白色頁面，
// 只留下線條。還沒上傳時顯示虛線佔位框。手稿比文字晚一點淡入，像正在被畫出來。
function BridgeScreen({
  data,
  projects,
}: {
  data: NonNullable<typeof manifesto.bridge>;
  projects: [BridgeProject, BridgeProject];
}) {
  const points = (data.points ?? "").split("\n").filter((l) => l.trim());
  return (
    <>
      <Reveal>
        {data.title && (
          <h2 className="font-serif-tc text-3xl leading-[1.35] font-semibold sm:text-4xl">
            <BambooAccent text={data.title} words={["竹構"]} />
          </h2>
        )}
        {points.length > 0 && (
          <ul className="mt-5 flex flex-col gap-2 font-serif-tc text-base sm:mt-6 sm:flex-row sm:flex-wrap sm:gap-x-12 sm:text-xl">
            {points.map((p, i) => (
              <li key={i}>
                <span className="mr-2" style={MUTED}>
                  ☉
                </span>
                {p}
              </li>
            ))}
          </ul>
        )}
        {data.quote && (
          <p className="mt-5 text-sm leading-[1.9] whitespace-pre-line sm:mt-6 sm:font-serif-tc sm:text-base" style={MUTED}>
            {data.quote}
          </p>
        )}
      </Reveal>

      <Reveal delay={0.1} className="mt-8 flex items-center gap-4 sm:mt-[4vh]">
        <span className={`flex-1 border-t ${RULE}`} />
        {data.divider && (
          <span className={EYEBROW} style={MUTED}>
            {data.divider}
          </span>
        )}
        <span className={`flex-1 border-t ${RULE}`} />
      </Reveal>

      {/* 左右兩半貼齊畫面左右邊緣（抵掉 Screen 的左右內距），分界正好在畫面中線，跟兩欄展覽一致 */}
      <div className="-mx-6 mt-6 grid grid-cols-2 sm:-mx-16 sm:mt-[4vh] lg:-mx-24">
        {projects.map((p, i) => {
          const intro = data.intros?.[p.slug];
          return (
            <div key={p.slug} className="flex flex-col items-center px-3 text-center sm:px-10 lg:px-16">
              <Reveal delay={0.35 + i * 0.15} className="w-full">
                <div className="relative mx-auto aspect-[3/2] w-full max-w-[560px] sm:h-[clamp(140px,26vh,380px)] sm:w-auto sm:max-w-full">
                  {/* （2026-10-16）手稿先出現，約 1.6 秒後淡出、換成這一案的首頁封面照片——往下捲時同一張照片在
                      兩欄展覽滿版放大，理念到實體之間有個銜接，不是突然冒出一張大圖。沒有手稿就直接顯示封面照片。 */}
                  {p.cover && (
                    <motion.div
                      className="absolute inset-0"
                      initial={{ opacity: p.sketch ? 0 : 1 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ amount: 0.5 }}
                      transition={{ duration: 1.2, delay: p.sketch ? 1.6 : 0, ease: "easeInOut" }}
                    >
                      <Image src={p.cover} alt={p.name} fill sizes="(max-width: 640px) 50vw, 40vw" className="object-cover" />
                    </motion.div>
                  )}
                  {p.sketch ? (
                    <motion.div
                      className="absolute inset-0"
                      initial={{ opacity: 1 }}
                      whileInView={{ opacity: p.cover ? 0 : 1 }}
                      viewport={{ amount: 0.5 }}
                      transition={{ duration: 1.2, delay: 1.6, ease: "easeInOut" }}
                    >
                      <Image
                        src={p.sketch}
                        alt={`${p.name} 手稿`}
                        fill
                        sizes="(max-width: 640px) 50vw, 40vw"
                        className="object-contain mix-blend-multiply"
                      />
                    </motion.div>
                  ) : p.cover ? null : (
                    <div
                      className={`flex h-full w-full items-center justify-center border border-dashed ${RULE} ${EYEBROW}`}
                      style={MUTED}
                    >
                      手稿
                    </div>
                  )}
                </div>
              </Reveal>
              <Reveal delay={0.2 + i * 0.15}>
                <p className="mt-5 font-serif-tc text-lg font-semibold sm:mt-[2.5vh] sm:text-2xl">{p.name}</p>
                {/* （2026-10-16）案名下方改放一兩句讓人馬上懂這個案子在做什麼的簡介（後台「策展宣言」第 6 區塊
                    填寫）；地點 · 年份 · 類型只在沒填簡介時當備用 */}
                {intro ? (
                  <p className="mx-auto mt-3 max-w-md font-serif-tc text-sm leading-[1.8] sm:text-base" style={MUTED}>
                    {intro}
                  </p>
                ) : (
                  p.meta && (
                    <p className="mt-1 text-xs sm:text-sm" style={MUTED}>
                      {p.meta}
                    </p>
                  )
                )}
              </Reveal>
            </div>
          );
        })}
      </div>
    </>
  );
}

function ClosingScreen({ data }: { data: NonNullable<typeof manifesto.closing> }) {
  const variables = (data.variables ?? "").split("\n").filter((l) => l.trim());
  return (
    <>
      <Reveal>
        {data.title && <p className="font-serif-tc text-2xl font-semibold sm:text-4xl">{data.title}</p>}
        {data.emphasis && (
          // （2026-10-16）第二行（業主決定結果。）整行竹棕色
          <h2
            className="mt-2 font-serif-tc text-4xl leading-[1.25] font-semibold sm:mt-3 sm:text-6xl lg:text-7xl"
            style={{ color: ACCENT }}
          >
            {data.emphasis}
          </h2>
        )}
      </Reveal>
      <Reveal delay={0.15} className={`mt-10 grid gap-10 border-t ${RULE} pt-8 sm:mt-[7vh] sm:grid-cols-2 sm:gap-16 sm:pt-[5vh] lg:gap-24`}>
        <div>
          {(data.from || data.to) && (
            <div className="font-serif-tc">
              {data.from && (
                <p className="text-lg sm:text-xl" style={MUTED}>
                  {data.from}
                </p>
              )}
              {data.from && data.to && (
                <svg aria-hidden className="my-3" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={MUTED}>
                  <path d="M12 4v16M6 14l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              {data.to && <p className="text-xl font-semibold sm:text-2xl">{data.to}</p>}
            </div>
          )}
          {data.shiftBody && (
            <p className="mt-6 text-sm leading-[1.95] whitespace-pre-line sm:text-base" style={MUTED}>
              {data.shiftBody}
            </p>
          )}
        </div>
        <div>
          {variables.length > 0 && (
            <ul className="space-y-2 font-serif-tc text-xl font-semibold sm:text-2xl">
              {variables.map((v, i) => (
                <li key={i}>{v}</li>
              ))}
            </ul>
          )}
          {data.variablesBody && (
            <p className="mt-6 text-sm leading-[1.95] whitespace-pre-line sm:text-base" style={MUTED}>
              {data.variablesBody}
            </p>
          )}
        </div>
      </Reveal>
    </>
  );
}

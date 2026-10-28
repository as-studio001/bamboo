"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { MotionConfig, motion, useInView, useReducedMotion } from "framer-motion";
import { manifesto } from "@/lib/manifesto";

// 首頁最上面的「策展宣言」，點進網站先看到這裡，往下捲完才進到兩欄並列的展覽（SplitExhibition）。
// 這一段不屬於任何一個建築案，是整個展覽層級的論述，跟 project.intro（各案自己的簡介）分開。
//
// （2026-10-15）從單一畫面改成六個連續的滿版畫面（內容整理自策展簡報）；（2026-10-16）再濃縮成兩屏：
//   01 宣言（IntroScreen）：計畫名稱、主張一句、NOT／NOT／BUT、參與者
//   02 系統 → 兩案（SystemScreen）：A ＋ B ＝ ？、系統提供可能，業主決定結果、兩案預告（銜接兩欄展覽）
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

// 第二屏三個標題：進場跟輪流強調是同一個節奏、同一種動作（2026-10-28）——
// 每 POINT_HOLD_MS 換一句當「亮的那句」（全彩、微放大），其他已出現的句子變淡（第一輪出現時快一點，每 POINT_ENTER_MS）；
// 還沒輪到的句子先藏著（透明、縮小一點），輪到時從小放大浮現、直接成為亮的那句。
// 三句都出現後就一直這樣循環。離開這一屏就重置，回來再從頭播。
// 系統「減少動態效果」時不播，三句都維持全彩
const POINT_WORDS = ["生活中", "像組積木", "和你一起"];
const POINT_HOLD_MS = 3000;
const POINT_ENTER_MS = 1500;

function PointsRotator({ points }: { points: string[] }) {
  const ref = useRef<HTMLUListElement>(null);
  const inView = useInView(ref, { amount: 0.3 });
  const reduce = useReducedMotion();
  const [step, setStep] = useState(-1); // 第幾拍；-1：還沒開始（三句都藏著）
  useEffect(() => {
    if (!inView || reduce) return;
    let timer = 0;
    // 第一輪（三句依序出現）每 POINT_ENTER_MS 換一句，比較快；之後的輪播每 POINT_HOLD_MS 換一句
    const tick = (s: number) => {
      setStep(s);
      timer = window.setTimeout(() => tick(s + 1), s < points.length - 1 ? POINT_ENTER_MS : POINT_HOLD_MS);
    };
    // 稍等一下再開始，讓第一句也有從藏著到出現的過渡
    timer = window.setTimeout(() => tick(0), 150);
    return () => {
      window.clearTimeout(timer);
      setStep(-1);
    };
  }, [inView, reduce, points.length]);
  const active = step >= 0 ? step % points.length : -1;
  return (
    <ul
      ref={ref}
      className="flex flex-col gap-1 font-serif-tc text-xl leading-[1.4] font-semibold sm:flex-row sm:flex-wrap sm:gap-x-8 sm:text-3xl"
    >
      {points.map((p, i) => {
        const shown = reduce || step >= i; // 已經輪到過
        const on = !reduce && active === i;
        return (
          <li
            key={i}
            className="origin-left transition-[opacity,transform] duration-[900ms] ease-in-out"
            style={{
              opacity: !shown ? 0 : on || reduce ? 1 : 0.3,
              transform: !shown ? "scale(0.98)" : on ? "scale(1.02)" : "scale(1)",
            }}
          >
            <span className="mr-2 font-normal" style={{ color: ACCENT }}>
              ☉
            </span>
            <BambooAccent text={p} words={POINT_WORDS} />
          </li>
        );
      })}
    </ul>
  );
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
  backdrop,
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
  backdrop?: string; // 淺色滿版背景圖（不加深色遮罩，見 lib/manifesto.ts）
  // （2026-10-16）右下角主視覺（去背圖），參考海報構圖：竹剖面貼齊畫面右緣、一部分超出畫面，放在文字後面
  figure?: string;
}) {
  const last = index === total - 1;
  return (
    <section
      id={id}
      className={`paper ${image ? "paper-dark" : ""} relative flex min-h-[100dvh] w-full shrink-0 snap-start flex-col overflow-hidden px-6 pt-16 text-[var(--foreground)] sm:h-[100dvh] sm:min-h-0 sm:px-16 sm:pt-[6vh] lg:px-24`}
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
      {backdrop && !image && (
        <>
          <Image src={backdrop} alt="" fill priority sizes="100vw" className="object-cover object-right" />
          {/* 左側薄霧：紙色由左往右漸透明，文字壓在上面清楚；右側竹影維持原樣 */}
          <div
            aria-hidden
            className="absolute inset-0 hidden sm:block"
            style={{ background: "linear-gradient(to right, rgb(241 238 231 / 0.88) 0%, rgb(241 238 231 / 0.6) 38%, rgb(241 238 231 / 0) 62%)" }}
          />
          {/* 手機：直式畫面竹影會落在文字正後方，整片蓋一層較濃的紙色，只讓竹影淡淡透出來 */}
          <div aria-hidden className="absolute inset-0 sm:hidden" style={{ background: "rgb(241 238 231 / 0.82)" }} />
        </>
      )}
      {figure && !image && !backdrop && (
        <motion.div
          aria-hidden
          // （2026-10-16）完全不透明（同日試過 0.6 → 0.8 → 0.92，最後改回不透明）
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
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
        {/* 最後一屏中間已經有「看兩個計畫 ↓」，右下角不重複放 */}
        {!last && (
          <button
            onClick={scrollToExhibition}
            className={`${EYEBROW} link-underline transition-opacity hover:opacity-100`}
            style={MUTED}
          >
            略過宣言 →
          </button>
        )}
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
  // （2026-10-16）六屏濃縮成兩屏：
  //   01 宣言：計畫名稱＋主張一句（statement.title）＋ NOT／NOT／BUT ＋參與者（cover.credit）
  //   02 系統 → 兩案：A ＋ B ＝ ？一行公式＋「系統提供可能，業主決定結果。」＋兩案預告
  // 數字（counts）、竹構生成鏈、轉變前後（closing.from/to…）、三個面向（bridge.points／quote）、
  // 展覽構成（cover.notes）、一句話（cover.tagline）暫不顯示——資料仍留在 content/manifesto.json，
  // 後台也還能編輯，之後要加回來不用重打。
  const { eyebrow, cover, statement, formula, closing, bridge } = manifesto;
  const screens = [
    cover && {
      key: "cover",
      label: cover.label,
      body: <IntroScreen eyebrow={eyebrow} data={cover} statement={statement} />,
    },
    bridge &&
      projects && {
        key: "bridge",
        label: bridge.label,
        body: <SystemScreen data={bridge} formula={formula} closing={closing} />,
      },
  ].filter((s): s is { key: string; label: string | undefined; body: React.ReactElement } => !!s);

  return (
    // 系統開了「減少動態效果」時不做位移動畫
    <MotionConfig reducedMotion="user">
      {screens.map((s, i) => (
        <Screen
          key={s.key}
          id={i === 0 ? "manifesto" : undefined}
          index={i}
          total={screens.length}
          label={s.label}
          image={s.key === "cover" ? cover?.image : undefined}
          figure={s.key === "cover" ? cover?.figure : undefined}
          backdrop={s.key === "cover" ? cover?.backdrop : undefined}
        >
          {s.body}
        </Screen>
      ))}
    </MotionConfig>
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

// 有右下角主視覺（竹剖面）時，第一屏左側內容（含細線）的最大寬度：停在竹剖面左邊 48px，不跟竹子重疊
const BESIDE_FIGURE = "sm:max-w-[calc(100vw-min(32vw,54vh)-4rem-48px)] lg:max-w-[calc(100vw-min(32vw,54vh)-6rem-48px)]";

// 第一屏「宣言」：計畫名稱＋英文副標＋主張一句＋ NOT／NOT／BUT 一排小格＋參與者表格
function IntroScreen({
  eyebrow,
  data,
  statement,
}: {
  eyebrow?: string;
  data: NonNullable<typeof manifesto.cover>;
  statement?: typeof manifesto.statement;
}) {
  // 淺色背景圖（竹影在右半部）：文字區限制在左側約一半，不壓到竹影；只有主視覺時停在竹剖面左邊
  const beside = data.image ? "" : data.backdrop ? "sm:max-w-[60vw] lg:max-w-[56vw]" : data.figure ? BESIDE_FIGURE : "";
  const contrasts = statement?.contrasts ?? [];
  const credits = lines(data.credit);
  return (
    <div className={beside}>
      <Reveal>
        {eyebrow && (
          <p className={EYEBROW} style={MUTED}>
            {eyebrow}
          </p>
        )}
        {data.title && (
          <h1 className="mt-5 font-serif-tc text-4xl leading-[1.2] font-semibold sm:mt-6 sm:text-6xl sm:whitespace-nowrap lg:text-7xl">
            <BambooAccent text={data.title} />
          </h1>
        )}
        {data.subtitle && (
          <p className="mt-2 font-serif-tc text-xl italic sm:mt-3 sm:text-3xl" style={MUTED}>
            {data.subtitle}
          </p>
        )}
        {statement?.title && (
          // 主張一句：原本第二屏的大標，放得下就排成一行；放不下時只在原本換行的地方
          // （逗號後）斷開，不會斷在詞中間（例如「竹／小屋」）
          <p className="mt-7 font-serif-tc text-xl leading-[1.5] font-semibold sm:mt-[5vh] sm:text-3xl">
            {statement.title.split(/\s*\n\s*/).map((seg, i) => (
              <span key={i} className="inline-block">
                <BambooAccent text={seg} words={["竹小屋", "竹子", "竹構", "竹"]} />
              </span>
            ))}
          </p>
        )}
        {statement?.en && (
          // 主張句的英文（2026-10-19）
          <p className="mt-1.5 font-serif-tc text-sm italic sm:text-lg" style={MUTED}>
            {statement.en}
          </p>
        )}
      </Reveal>

      {contrasts.length > 0 && <Contrasts items={contrasts} />}
      {credits.length > 0 && (
        <Reveal delay={0.24} className={`mt-8 border-t ${RULE} pt-5 sm:mt-[5vh] sm:pt-6`}>
          <dl className="grid grid-cols-[auto_1fr] items-baseline gap-x-8 gap-y-2 sm:gap-x-12">
            {credits.map((l, i) =>
              l.label ? (
                <Fragment key={i}>
                  <dt className="font-serif-tc text-sm leading-[1.9] sm:text-base" style={MUTED}>
                    {l.label}
                  </dt>
                  <dd className="font-serif-tc text-sm leading-[1.9] font-semibold sm:text-lg">{l.value}</dd>
                </Fragment>
              ) : (
                <dd key={i} className="col-span-2 font-serif-tc text-sm leading-[1.9] font-semibold sm:text-lg">
                  {l.value}
                </dd>
              ),
            )}
          </dl>
        </Reveal>
      )}
    </div>
  );
}

// 第二屏「為什麼 → 系統 → 兩案」（2026-10-16 改版）由上而下：
//   1. 三個面向（☉，一行）
//   2. 為什麼要做竹小屋：四格關鍵字＋一句說明（bridge.reasons）
//   3. A ＋ B ＝ ？一行公式
//   4. 系統提供可能，業主決定結果。
//   5. 「看兩個計畫 ↓」：捲到兩欄展覽（跟往下滾一樣，不直接進各案，避免跳過兩案並排）
// （2026-10-19）原本第 5 項「兩組實驗場域」兩案預告（封面照片／手稿、案名、簡介）拿掉，只留按鈕；上方文字整體放大。
// 資料（bridge.intros、各案 sketchImages）保留不刪，之後要加回來不用重填。
function SystemScreen({
  data,
  formula,
  closing,
}: {
  data: NonNullable<typeof manifesto.bridge>;
  formula?: typeof manifesto.formula;
  closing?: typeof manifesto.closing;
}) {
  const terms = formula?.terms ?? [];
  const points = (data.points ?? "").split("\n").filter((l) => l.trim());
  const reasons = (data.reasons ?? []).filter((r) => r.title || r.text);
  // （2026-10-28）只有最上面三個標題有浮現動畫，下面的內容一開始就在、不做進場動畫
  return (
    <>
      {points.length > 0 && <PointsRotator points={points} />}

      {reasons.length > 0 && (
        <div className="mt-8 sm:mt-[7vh]">
          {data.reasonsLabel && (
            // 小標放大（2026-10-28），右邊接英文
            <p className="flex flex-wrap items-baseline gap-x-4 font-serif-tc">
              <span className="text-base font-semibold sm:text-lg" style={MUTED}>
                {data.reasonsLabel}
              </span>
              {data.reasonsLabelEn && (
                <span className="text-sm italic sm:text-base" style={MUTED}>
                  {data.reasonsLabelEn}
                </span>
              )}
            </p>
          )}
          <div className={`mt-3 grid grid-cols-2 gap-x-5 gap-y-5 border-t ${RULE} pt-5 sm:grid-cols-4 sm:gap-x-10 sm:pt-6`}>
            {reasons.map((r, i) => (
              <div key={i}>
                <p className="font-serif-tc text-[15px] font-semibold sm:text-xl">{r.title}</p>
                <p className="mt-2 text-sm leading-[1.8] sm:font-serif-tc sm:text-[15px]" style={MUTED}>
                  {r.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-10 sm:mt-[6vh]">
        {terms.length > 0 && (
          // A ＋ B ＝ ？一橫排（2026-10-28 放大 2 倍）：第一列大字符號＋運算符號，第二列標題放在各自符號正下方
          // （標題放符號旁邊的話，2 倍字寬一排放不下）。電腦版大字最大 7.5rem（原本 6xl 的 2 倍），
          // 矮螢幕依畫面高度縮小，整屏才放得下
          <div
            className="grid items-center justify-start gap-x-2 font-serif-tc sm:gap-x-8"
            style={{ gridTemplateColumns: `repeat(${terms.length * 2 - 1}, auto)` }}
          >
            {terms.map((t, i) => (
              <Fragment key={i}>
                {i > 0 && (
                  <span className="row-start-1 text-3xl sm:text-[min(3.75rem,6.5vh)]" style={MUTED}>
                    {i === terms.length - 1 ? "=" : "+"}
                  </span>
                )}
                <span
                  className="row-start-1 text-center text-5xl leading-none font-semibold sm:text-[min(7.5rem,13vh)]"
                  style={{ gridColumn: i * 2 + 1 }}
                >
                  <Accented text={t.symbol} />
                </span>
                <span
                  className="row-start-2 mt-1 text-center text-[11px] whitespace-nowrap sm:mt-[1vh] sm:text-[min(1.75rem,3.2vh)]"
                  style={{ gridColumn: i * 2 + 1, ...MUTED }}
                >
                  {t.title}
                </span>
              </Fragment>
            ))}
          </div>
        )}
      </div>
        {(closing?.title || closing?.emphasis) && (
          <div className="mt-6 sm:mt-[3.5vh]">
            <p className="font-serif-tc text-xl leading-[1.4] font-semibold sm:text-4xl">
              {/* 兩段各自不斷行，放不下時從逗號後換行 */}
              <span className="inline-block">{closing.title}</span>
              {closing.emphasis && (
                <span className="inline-block" style={{ color: ACCENT }}>
                  {closing.emphasis}
                </span>
              )}
            </p>
          </div>
        )}

      {data.cta && (
        <div className="mt-10 flex justify-center sm:mt-[3vh]">
          <button
            onClick={scrollToExhibition}
            className="group inline-flex items-center gap-2 border px-7 py-3 font-serif-tc text-base font-semibold transition-colors hover:text-[#f7f3ec] sm:text-xl"
            style={{ borderColor: ACCENT, color: ACCENT }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = ACCENT)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}
          >
            {data.cta}
            <span aria-hidden className="transition-transform group-hover:translate-y-0.5">
              ↓
            </span>
          </button>
        </div>
      )}
    </>
  );
}

// 「不只是／不只是／而是」三格（2026-10-19）：電腦版每格文字不換行，最後一格（字最多）依文字寬度自動加寬；版面維持一排三格，依序輪流強調、一直循環——
// 當下那格稍微放大（不抬升）、透明底＋深色框、字加粗，其他兩格變淡；輪到「而是」時是竹棕色實底。每格約 2.5 秒。
// 「不只是」兩格平常用深一點的灰字（原本太淡）。系統「減少動態效果」時不播動畫，停在「而是」強調的狀態。
const CONTRAST_STEP_MS = 2500;
function Contrasts({ items }: { items: { label: string; text: string }[] }) {
  const last = items.length - 1;
  const [active, setActive] = useState(-1); // -1：還沒開始
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const done = () => setActive(last);
      done();
      return;
    }
    let interval = 0;
    const start = window.setTimeout(() => {
      setActive(0);
      interval = window.setInterval(() => setActive((a) => (a + 1) % items.length), CONTRAST_STEP_MS);
    }, 900);
    return () => {
      window.clearTimeout(start);
      window.clearInterval(interval);
    };
  }, [items, last]);
  const playing = active >= 0;
  return (
    <Reveal delay={0.12} className="mt-6 grid gap-2 sm:mt-[3.5vh] sm:grid-cols-[1fr_1fr_auto] sm:gap-4">
      {items.map((c, i) => {
        const answer = i === last;
        const on = i === active;
        const dim = playing && !on;
        // 「而是」只有輪到它（或播完）才變竹棕色實底；之前跟其他格一樣是框線
        const filled = answer && active === last;
        return (
          <div
            key={i}
            className={`flex flex-col gap-1 border px-4 py-3 origin-center transition-[opacity,background-color,border-color,box-shadow,scale] duration-700 sm:px-5 sm:py-4 ${
              filled ? "border-transparent shadow-[0_8px_24px_rgb(120_60_20/0.16)]" : on ? "border-[var(--foreground)] shadow-[0_8px_24px_rgb(40_30_20/0.12)]" : RULE
            } ${on ? "scale-[1.06]" : "scale-100"}`}
            style={{
              opacity: dim ? 0.35 : 1,
              backgroundColor: filled ? ACCENT : undefined, // 輪到「不只是」時不加底色，維持透明
              color: filled ? "#f7f3ec" : undefined,
            }}
          >
            <span
              className="font-serif-tc text-xs tracking-[0.15em] sm:text-sm"
              style={{ color: filled ? "rgb(247 243 236 / 0.85)" : "var(--foreground-muted)" }}
            >
              {c.label}
            </span>
            <span
              className={`font-serif-tc text-base sm:text-lg sm:whitespace-nowrap ${filled || on ? "font-semibold" : ""}`}
              // 小調整：「不只是」的內容字從淺灰改成接近內文的深灰
              style={{ color: filled ? undefined : on ? "var(--foreground)" : "rgb(38 34 30 / 0.78)" }}
            >
              {c.text}
            </span>
          </div>
        );
      })}
    </Reveal>
  );
}
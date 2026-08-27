import { NextResponse } from "next/server";
import { mkdir, readdir, writeFile } from "fs/promises";
import path from "path";
import { projects } from "@/lib/projects";

// 開發用的本機圖片上傳端點：把拖拉上傳的檔案直接寫進 public/images/{slug}/。
// 正式部署到 Vercel 之後檔案系統是唯讀的，這個端點會失效，屆時要換成
// Supabase Storage（或其他雲端物件儲存）搭配資料庫記錄圖片網址。
const VALID_SLUGS = new Set(projects.map((p) => p.slug));

function safeFilename(name: string) {
  const base = name.split(/[/\\]/).pop() ?? "image";
  return base.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const slug = formData.get("slug");
  const file = formData.get("file");

  if (typeof slug !== "string" || !VALID_SLUGS.has(slug)) {
    return NextResponse.json({ error: "invalid slug" }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "missing file" }, { status: 400 });
  }
  // 圖片／GIF／影片都收——image/* 本來就涵蓋 image/gif，不用特別另外判斷；影片是新增的，
  // 對應資料模型裡 chapter.video（見 lib/projects.ts）或未來想直接把動態素材當「照片」用
  // 的情境（例如 ProjectImage.src 指到一支短片）。
  if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
    return NextResponse.json({ error: "only image or video files are accepted" }, { status: 400 });
  }

  const dir = path.join(process.cwd(), "public", "images", slug);
  await mkdir(dir, { recursive: true });

  const filename = `${Date.now()}-${safeFilename(file.name)}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), bytes);

  return NextResponse.json({ url: `/images/${slug}/${filename}` });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");

  if (typeof slug !== "string" || !VALID_SLUGS.has(slug)) {
    return NextResponse.json({ error: "invalid slug" }, { status: 400 });
  }

  const dir = path.join(process.cwd(), "public", "images", slug);
  await mkdir(dir, { recursive: true });
  const files = await readdir(dir);

  return NextResponse.json({
    urls: files
      .filter((f) => !f.startsWith("."))
      .sort()
      .reverse()
      .map((f) => `/images/${slug}/${f}`),
  });
}

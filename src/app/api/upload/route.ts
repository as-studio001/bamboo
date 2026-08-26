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
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "only image files are accepted" }, { status: 400 });
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

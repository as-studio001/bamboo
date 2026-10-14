// 後台「本機模式」用的檔案讀寫 API（2026-10-14 新增）。
//
// 在自己電腦上跑 `npm run dev`、打開 localhost:3000/admin 時，後台改成呼叫這支 API，直接讀寫這台
// 電腦上的 content/ 跟 public/images、public/files——存檔不會上傳 GitHub、也不會觸發 Vercel 重新部署，
// 本機網站（dev server）偵測到檔案變動會自動更新，後台跟網頁即時連動。全部調整好之後再一起 commit／push。
//
// 動作跟後台原本呼叫的 github-proxy（Netlify Function）相同：getFile／listDir／putFile／deleteFile／
// uploadAsset，回傳格式也模仿 GitHub API（content 是 base64），後台其他程式碼不用改。
//
// 安全：只在開發模式（NODE_ENV === "development"，也就是 npm run dev）運作，正式網站一律回 404；
// 路徑只允許 content/、public/images/、public/files/ 底下，擋掉 ".." 之類跳出專案的路徑。
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const ROOT = process.cwd();
const ALLOWED_DIRS = ["content", "public/images", "public/files"];

function resolveSafe(relPath: string) {
  const normalized = path.posix.normalize(String(relPath || "").replace(/\\/g, "/")).replace(/^\/+/, "");
  const allowed = ALLOWED_DIRS.some((dir) => normalized === dir || normalized.startsWith(dir + "/"));
  if (!allowed || normalized.split("/").includes("..")) throw new HttpError(400, `不允許的路徑：${relPath}`);
  // turbopackIgnore：這支 API 只在本機開發時用，告訴打包工具不要因為這行動態路徑就把整個專案
  // （含 public 底下所有圖片）打包進正式網站的伺服器程式——不加的話 Vercel 部署會變慢、甚至超過大小上限。
  const abs = path.resolve(/*turbopackIgnore: true*/ ROOT, normalized);
  if (!abs.startsWith(ROOT + path.sep)) throw new HttpError(400, `不允許的路徑：${relPath}`);
  return { rel: normalized, abs };
}

class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

const sha = (buf: Buffer) => crypto.createHash("sha1").update(buf).digest("hex");

// 檔名清理：保留中英文、數字、- _ .，其他換成底線；前面加時間戳避免同名覆蓋（跟 github-proxy 的命名方式一致）
function safeFilename(name: string) {
  const cleaned = String(name || "file").replace(/[^\p{L}\p{N}._-]+/gu, "_");
  return `${Date.now()}-${cleaned}`;
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== "development") return new Response("Not found", { status: 404 });

  try {
    const body = await request.json();
    switch (body.action) {
      case "getFile": {
        const { abs } = resolveSafe(body.path);
        const buf = await fs.readFile(abs).catch(() => {
          throw new HttpError(404, `找不到檔案：${body.path}`);
        });
        return Response.json({ content: buf.toString("base64"), sha: sha(buf), path: body.path });
      }
      case "listDir": {
        const { rel, abs } = resolveSafe(body.path);
        const entries = await fs.readdir(abs, { withFileTypes: true }).catch(() => []);
        return Response.json(
          entries.map((e) => ({ name: e.name, path: `${rel}/${e.name}`, type: e.isDirectory() ? "dir" : "file" })),
        );
      }
      case "putFile": {
        const { abs } = resolveSafe(body.path);
        const buf = Buffer.from(String(body.content || ""), "base64");
        await fs.mkdir(path.dirname(abs), { recursive: true });
        await fs.writeFile(abs, buf);
        return Response.json({ content: { sha: sha(buf), path: body.path } });
      }
      case "deleteFile": {
        const { abs } = resolveSafe(body.path);
        await fs.unlink(abs).catch(() => {});
        return Response.json({ ok: true });
      }
      case "uploadAsset": {
        const filename = safeFilename(body.filename);
        const { rel, abs } = resolveSafe(`${body.folder}/${filename}`);
        const buf = Buffer.from(String(body.content || ""), "base64");
        await fs.mkdir(path.dirname(abs), { recursive: true });
        await fs.writeFile(abs, buf);
        return Response.json({ path: rel });
      }
      default:
        throw new HttpError(400, `不支援的動作：${body.action}`);
    }
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 500;
    return Response.json({ error: err instanceof Error ? err.message : String(err) }, { status });
  }
}

import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import worker from "./cloudflare-huangli-worker.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "../Output");
const port = Number(process.env.PORT || 8787);

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

function resolveFilePath(urlPath) {
  const safePath = urlPath === "/" ? "/index.html" : urlPath;
  const finalPath = path.resolve(rootDir, `.${safePath}`);
  if (!finalPath.startsWith(rootDir)) {
    throw new Error("Path escapes root directory");
  }
  return finalPath;
}

const server = http.createServer(async (req, res) => {
  try {
    const requestUrl = new URL(req.url || "/", `http://${req.headers.host}`);

    if (requestUrl.pathname === "/api/huangli") {
      const workerRequest = new Request(requestUrl.toString(), {
        method: "GET",
      });
      const workerResponse = await worker.fetch(workerRequest);
      const body = await workerResponse.text();

      res.writeHead(workerResponse.status, {
        "content-type": workerResponse.headers.get("content-type") || "application/json; charset=utf-8",
        "access-control-allow-origin": "*",
      });
      res.end(body);
      return;
    }

    const filePath = resolveFilePath(requestUrl.pathname);
    const file = await readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();

    res.writeHead(200, {
      "content-type": MIME_TYPES[ext] || "application/octet-stream",
    });
    res.end(file);
  } catch (error) {
    if (error.code === "ENOENT") {
      res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      res.end("Not Found");
      return;
    }

    res.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
    res.end(`Server Error: ${error.message}`);
  }
});

server.listen(port, () => {
  console.log(`Preview server running at http://localhost:${port}`);
});

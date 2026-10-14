import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
export { chromium } from "playwright";
import { chromium } from "playwright";
import chromiumPackage from "@sparticuz/chromium";
export async function harness(options = {}) {
  const root = path.resolve("dist/client");
  const types = {
    ".html": "text/html",
    ".js": "text/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".woff2": "font/woff2",
    ".woff": "font/woff",
  };
  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, "http://localhost");
      const name = decodeURIComponent(url.pathname);
      let file = path.resolve(
        root,
        "." + (name === "/" ? "/index.html" : name),
      );
      if (!file.startsWith(root + path.sep)) {
        res.writeHead(403);
        return res.end();
      }
      let data;
      try {
        data = await fs.readFile(file);
      } catch {
        res.writeHead(404);
        return res.end();
      }
      res.writeHead(200, {
        "content-type": types[path.extname(file)] || "application/octet-stream",
        "cache-control": "no-store",
      });
      res.end(data);
    } catch {
      res.writeHead(400);
      res.end();
    }
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const browser = await chromium.launch({
    executablePath:
      process.env.RELAY_CHROMIUM_PATH ||
      (await chromiumPackage.executablePath()),
    headless: true,
    args: [
      "--no-sandbox",
      "--no-zygote",
      "--disable-features=V8TrapHandler",
      "--use-gl=angle",
      "--use-angle=swiftshader",
      "--disable-dev-shm-usage",
    ],
    env: {
      ...process.env,
      LD_LIBRARY_PATH: "/tmp",
      FONTCONFIG_PATH: "/tmp/fonts",
    },
  });
  return {
    browser,
    url: `http://127.0.0.1:${server.address().port}`,
    close: async () => {
      await browser.close();
      await new Promise((r) => server.close(r));
    },
  };
}

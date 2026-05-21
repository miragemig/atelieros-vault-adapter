import http from "http";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { routeIntent } from "../chat/zeusIntentRouter";
import { createZeusResponse } from "../chat/zeusAdvisor";
import { readOperationalContext } from "../chat/zeusOperationalContext";

const root = process.cwd();
const port = 3333;

const htmlPath = path.join(
  root,
  "founder-command-center/ui/zeus-console.html"
);
const shouldOpenBrowser = process.argv.includes("--open");

function sendJson(res: http.ServerResponse, data: unknown, status = 200) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data, null, 2));
}

function sendText(res: http.ServerResponse, text: string, status = 200, contentType = "text/plain; charset=utf-8") {
  res.writeHead(status, { "Content-Type": contentType });
  res.end(text);
}

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    const url = req.url || "/";

    if (req.method === "GET" && url === "/") {
      if (!fs.existsSync(htmlPath)) {
        sendText(res, "Missing zeus-console.html", 500);
        return;
      }

      sendText(res, fs.readFileSync(htmlPath, "utf-8"), 200, "text/html; charset=utf-8");
      return;
    }

    if (req.method === "GET" && url === "/api/status") {
      const context = readOperationalContext();

      sendJson(res, {
        mode: "DELIBERATION_ONLY",
        gitStatus: context.gitStatus,
        currentTask:
          context.gatewayState?.session?.currentFocus ||
          context.buildTask?.id ||
          "unknown",
        latestReportStatus:
          context.gatewayState?.build?.latestReportStatus ||
          context.latestReport?.status ||
          "unknown",
        latestReportPath: context.latestReportPath || null,
        nextRecommendedAction: context.gatewayState?.nextRecommendedAction || null,
        recentEvents: context.recentEvents || []
      });
      return;
    }

    if (req.method === "POST" && url === "/api/chat") {
      const rawBody = await readBody(req);
      const parsed = JSON.parse(rawBody || "{}");
      const message = String(parsed.message || "").trim();

      if (!message) {
        sendJson(res, { error: "Missing message." }, 400);
        return;
      }

      const routed = routeIntent(message);
      const response = createZeusResponse(message, routed);

      sendJson(res, {
        message,
        routed,
        response
      });
      return;
    }

    sendJson(res, { error: "Not found." }, 404);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    sendJson(res, { error: message }, 500);
  }
});

server.listen(port, () => {
  const url = `http://localhost:${port}`;
  console.log(`ZEUS Console running at ${url}`);

  if (shouldOpenBrowser) {
    exec(`start "" "${url}"`, { shell: "powershell.exe" }, () => {
      // Browser auto-open is convenience only. The server should keep running either way.
    });
  }
});

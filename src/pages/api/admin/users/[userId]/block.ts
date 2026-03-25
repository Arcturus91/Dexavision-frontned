import type { NextApiRequest, NextApiResponse } from "next";

function getServerUrl(): string {
  const base = process.env.SERVER_URL ?? "";
  if (!base) throw new Error("SERVER_URL no está configurado en el entorno.");
  return base.replace(/\/$/, "");
}

function readQueryString(q: string | string[] | undefined): string | null {
  if (typeof q === "string") return q;
  if (Array.isArray(q) && typeof q[0] === "string") return q[0];
  return null;
}

function readReason(body: unknown): string {
  if (!body || typeof body !== "object") return "";
  const b = body as Record<string, unknown>;
  return typeof b.reason === "string" ? b.reason : "";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PATCH") {
    res.setHeader("Allow", "PATCH");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const authorization = req.headers.authorization;
  if (!authorization || !authorization.toLowerCase().startsWith("bearer ")) {
    return res.status(401).json({ error: "Missing Authorization Bearer token" });
  }

  const userId = readQueryString(req.query.userId);
  if (!userId) return res.status(400).json({ error: "Missing userId" });

  const reason = readReason(req.body);

  let upstream: Response;
  try {
    upstream = await fetch(
      `${getServerUrl()}/admin/users/${encodeURIComponent(userId)}/block`,
      {
        method: "PATCH",
        headers: {
          authorization,
          accept: "application/json",
          "content-type": "application/json",
        },
        body: JSON.stringify({ reason }),
      },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upstream fetch failed";
    return res.status(502).json({ error: message });
  }

  const contentType = upstream.headers.get("content-type") ?? "";
  res.setHeader("content-type", contentType || "application/json");

  if (contentType.includes("application/json")) {
    const data = await upstream.json().catch(() => null);
    return res.status(upstream.status).json(data);
  }

  const text = await upstream.text().catch(() => "");
  return res.status(upstream.status).send(text);
}


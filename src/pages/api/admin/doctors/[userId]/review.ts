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

type ReviewBody = {
  action?: unknown;
  message?: unknown;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PUT") {
    res.setHeader("Allow", "PUT");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const authorization = req.headers.authorization;
  if (!authorization || !authorization.toLowerCase().startsWith("bearer ")) {
    return res.status(401).json({ error: "Missing Authorization Bearer token" });
  }

  const userId = readQueryString(req.query.userId);
  if (!userId) return res.status(400).json({ error: "Missing userId" });

  const body = (req.body ?? {}) as ReviewBody;
  const action = typeof body.action === "string" ? body.action : "";
  const message = typeof body.message === "string" ? body.message : "";

  if (action !== "approve" && action !== "reject") {
    return res.status(400).json({ error: "Invalid action" });
  }

  let upstream: Response;
  try {
    upstream = await fetch(
      `${getServerUrl()}/admin/doctors/${encodeURIComponent(userId)}/review`,
      {
        method: "PUT",
        headers: {
          authorization,
          accept: "application/json",
          "content-type": "application/json",
        },
        body: JSON.stringify({ action, message }),
      },
    );
  } catch (err) {
    const error = err instanceof Error ? err.message : "Upstream fetch failed";
    return res.status(502).json({ error });
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


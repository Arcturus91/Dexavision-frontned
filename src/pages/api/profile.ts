import type { NextApiRequest, NextApiResponse } from "next";

function getServerUrl(): string {
  const base = process.env.SERVER_URL ?? "";
  if (!base) throw new Error("SERVER_URL no está configurado en el entorno.");
  return base.replace(/\/$/, "");
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const authorization = req.headers.authorization;
  if (!authorization || !authorization.toLowerCase().startsWith("bearer ")) {
    return res
      .status(401)
      .json({ error: "Missing Authorization Bearer token" });
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${getServerUrl()}/doctor/profile`, {
      method: "GET",
      headers: {
        authorization,
        accept: "application/json",
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Upstream fetch failed";
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

import { createHash } from "crypto";
export const COOKIE_NAME = "watchtower_auth";
export function authValue() {
  const password = process.env.DASHBOARD_PASSWORD || "";
  const secret = process.env.AUTH_SECRET || "";
  return createHash("sha256").update(`${password}:${secret}`).digest("hex");
}

import crypto from "crypto"

export const ADMIN_COOKIE_NAME = "admin_session"
export const ADMIN_TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 7

function getAdminSecret() {
  return process.env.ADMIN_AUTH_SECRET || ""
}

export function signAdminToken() {
  const secret = getAdminSecret()
  if (!secret) return null
  const payload = String(Date.now())
  const signature = crypto.createHmac("sha256", secret).update(payload).digest("hex")
  return `${payload}.${signature}`
}

export function verifyAdminToken(token?: string | null) {
  const secret = getAdminSecret()
  if (!secret || !token) return false
  const [payload, signature] = token.split(".")
  if (!payload || !signature) return false
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex")
  const sigBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expected)
  if (sigBuffer.length !== expectedBuffer.length) return false
  if (!crypto.timingSafeEqual(sigBuffer, expectedBuffer)) return false
  const issuedAt = Number(payload)
  if (!Number.isFinite(issuedAt)) return false
  return Date.now() - issuedAt <= ADMIN_TOKEN_TTL_MS
}

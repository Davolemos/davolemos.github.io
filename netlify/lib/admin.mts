import { timingSafeEqual } from "node:crypto"

// Contraseña del panel (variable de entorno ADMIN_PASSWORD en Netlify)
export const passwordOk = (given: unknown) => {
  const expected = Netlify.env.get("ADMIN_PASSWORD") ?? ""
  if (!expected || typeof given !== "string") return false
  const a = Buffer.from(given), b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

// Frena intentos repetidos de adivinar la contraseña
export const slowDown = () => new Promise((r) => setTimeout(r, 800))

export const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "cache-control": "no-store" } })

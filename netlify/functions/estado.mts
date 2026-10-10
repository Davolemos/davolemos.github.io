import { getStore } from "@netlify/blobs"
import type { Config } from "@netlify/functions"
import { timingSafeEqual } from "node:crypto"

// Estado de la agenda del estudio.
// GET  /api/estado → { abierta, mes } (público, lo lee la home)
// POST /api/estado → guarda { abierta, mes } (requiere la contraseña ADMIN_PASSWORD)

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]
const KEY = "agenda"

type Estado = { abierta: boolean; mes: string; actualizado?: string }

const store = () => getStore({ name: "estudio", consistency: "strong" })

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "cache-control": "no-store" } })

const passwordOk = (given: string) => {
  const expected = Netlify.env.get("ADMIN_PASSWORD") ?? ""
  if (!expected) return false
  const a = Buffer.from(given), b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

export default async (req: Request) => {
  if (req.method === "GET") {
    const estado = (await store().get(KEY, { type: "json" })) as Estado | null
    return json(estado ?? { abierta: true, mes: MESES[new Date().getMonth()] })
  }

  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405)

  let body: { password?: unknown; abierta?: unknown; mes?: unknown }
  try { body = await req.json() } catch { return json({ error: "Datos inválidos" }, 400) }

  if (typeof body.password !== "string" || !passwordOk(body.password)) {
    await new Promise((r) => setTimeout(r, 800)) // frena intentos repetidos
    return json({ error: "Contraseña incorrecta" }, 401)
  }
  if (typeof body.abierta !== "boolean" || typeof body.mes !== "string" || !MESES.includes(body.mes)) {
    return json({ error: "Elige si la agenda está abierta o cerrada y un mes" }, 400)
  }

  const estado: Estado = { abierta: body.abierta, mes: body.mes, actualizado: new Date().toISOString() }
  await store().setJSON(KEY, estado)
  return json(estado)
}

export const config: Config = { path: "/api/estado", method: ["GET", "POST"] }

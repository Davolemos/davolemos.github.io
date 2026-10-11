import { getStore } from "@netlify/blobs"
import type { Config } from "@netlify/functions"
import { json, passwordOk, slowDown } from "../lib/admin.mts"

// Estado de la agenda del estudio.
// GET  /api/estado → { abierta, mes, regreso? } (público, lo lee la home)
// POST /api/estado → guarda { abierta, mes, regreso? } (requiere la contraseña ADMIN_PASSWORD)
// regreso: mes en que se vuelve a abrir la agenda; solo se usa cuando está cerrada

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]
const KEY = "agenda"

type Estado = { abierta: boolean; mes: string; regreso?: string; actualizado?: string }

const store = () => getStore({ name: "estudio", consistency: "strong" })

export default async (req: Request) => {
  if (req.method === "GET") {
    const estado = (await store().get(KEY, { type: "json" })) as Estado | null
    return json(estado ?? { abierta: true, mes: MESES[new Date().getMonth()] })
  }

  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405)

  let body: { password?: unknown; abierta?: unknown; mes?: unknown; regreso?: unknown }
  try { body = await req.json() } catch { return json({ error: "Datos inválidos" }, 400) }

  if (!passwordOk(body.password)) {
    await slowDown()
    return json({ error: "Contraseña incorrecta" }, 401)
  }
  if (typeof body.abierta !== "boolean" || typeof body.mes !== "string" || !MESES.includes(body.mes)) {
    return json({ error: "Elige si la agenda está abierta o cerrada y un mes" }, 400)
  }

  const regreso = body.regreso
  if (regreso !== undefined && regreso !== "" && (typeof regreso !== "string" || !MESES.includes(regreso))) {
    return json({ error: "Elige un mes de regreso válido" }, 400)
  }

  const estado: Estado = { abierta: body.abierta, mes: body.mes, actualizado: new Date().toISOString() }
  if (!body.abierta && regreso) estado.regreso = regreso as string
  await store().setJSON(KEY, estado)
  return json(estado)
}

export const config: Config = { path: "/api/estado", method: ["GET", "POST"] }

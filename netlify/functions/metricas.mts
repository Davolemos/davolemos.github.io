import { getStore } from "@netlify/blobs"
import type { Config } from "@netlify/functions"
import { json, passwordOk, slowDown } from "../lib/admin.mts"

// Métricas propias, sin cookies ni datos personales.
// POST /api/evento   → la web registra una visita, una página vista o un contacto
// POST /api/metricas → el panel lee el resumen de un mes (requiere ADMIN_PASSWORD)
//
// Cada evento es un blob vacío cuyo nombre lleva toda la información:
//   2026-10/whatsapp/google/proyectos~chavela/<id>
// Así nunca se pisan dos eventos que llegan a la vez, y el resumen se arma
// solo listando los nombres del mes.

const TIPOS = ["entrada", "vista", "whatsapp", "email", "brief"] as const
const CONTACTOS = ["whatsapp", "email", "brief"]
const FUENTES = ["google", "bing", "instagram", "facebook", "behance", "linkedin", "tiktok", "whatsapp", "directo", "otro"]
const PAGINA = /^(inicio|(proyectos|servicios)~[a-z0-9-]{2,40})$/
const MES = /^\d{4}-(0[1-9]|1[0-2])$/
const BOT = /bot|crawl|spider|slurp|preview|headless|lighthouse|pingdom|monitor/i

const store = () => getStore({ name: "metricas" })

// Mes en hora de Panamá
const mesActual = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Panama", year: "numeric", month: "2-digit" }).format(new Date())

const registrar = async (req: Request) => {
  if (BOT.test(req.headers.get("user-agent") ?? "")) return new Response(null, { status: 204 })
  let e: { t?: unknown; f?: unknown; p?: unknown }
  try { e = JSON.parse((await req.text()).slice(0, 500)) } catch { return json({ error: "Datos inválidos" }, 400) }
  const tipo = TIPOS.find((t) => t === e.t)
  const fuente = FUENTES.includes(e.f as string) ? (e.f as string) : "otro"
  if (!tipo || typeof e.p !== "string" || !PAGINA.test(e.p)) return json({ error: "Datos inválidos" }, 400)
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  await store().set(`${mesActual()}/${tipo}/${fuente}/${e.p}/${id}`, "")
  return new Response(null, { status: 204 })
}

const resumir = async (req: Request) => {
  let body: { password?: unknown; mes?: unknown }
  try { body = await req.json() } catch { return json({ error: "Datos inválidos" }, 400) }
  if (!passwordOk(body.password)) { await slowDown(); return json({ error: "Contraseña incorrecta" }, 401) }
  const mes = typeof body.mes === "string" && MES.test(body.mes) ? body.mes : mesActual()

  const { blobs } = await store().list({ prefix: `${mes}/` })
  const contactos: Record<string, number> = { whatsapp: 0, email: 0, brief: 0 }
  const fuentes: Record<string, { visitas: number; contactos: number }> = {}
  const paginas: Record<string, { vistas: number; contactos: number }> = {}
  let visitas = 0, vistas = 0

  for (const { key } of blobs) {
    const [, tipo, fuente, pagina] = key.split("/")
    const f = (fuentes[fuente] ??= { visitas: 0, contactos: 0 })
    const p = (paginas[pagina] ??= { vistas: 0, contactos: 0 })
    if (tipo === "entrada") { visitas++; f.visitas++ }
    if (tipo === "entrada" || tipo === "vista") { vistas++; p.vistas++ }
    if (CONTACTOS.includes(tipo)) { contactos[tipo]++; f.contactos++; p.contactos++ }
  }

  const orden = <T extends Record<string, number>>(o: Record<string, T>, k: keyof T) =>
    Object.entries(o).map(([nombre, v]) => ({ nombre, ...v })).sort((a, b) => (b[k] as number) - (a[k] as number))

  return json({
    mes, visitas, vistas,
    contactos: { ...contactos, total: contactos.whatsapp + contactos.email + contactos.brief },
    fuentes: orden(fuentes, "visitas").filter((f) => f.visitas || f.contactos),
    paginas: orden(paginas, "vistas"),
  })
}

export default async (req: Request) => {
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405)
  return new URL(req.url).pathname === "/api/evento" ? registrar(req) : resumir(req)
}

// Límite por visitante: frena a quien quiera inflar los números o gastar invocaciones
export const config: Config = {
  path: ["/api/evento", "/api/metricas"],
  method: ["POST"],
  rateLimit: { windowLimit: 60, windowSize: 60, aggregateBy: ["ip", "domain"] },
}

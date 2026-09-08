# STATUS — home-tasks-manager

Actualizado: 2026-09-08

## Qué es

App de gestión de tareas del hogar: Next.js (Pages Router, fork del template "Vercel Cron Job Example")
que lee tareas recurrentes desde una DB de **Notion** (`TareaCasa`, `Workouts`, `WorkoutSession`)
y manda un digest diario por **Telegram** vía Vercel Cron (`0 8 * * *`).

## Stack

- Next.js 14 (Pages Router) + TypeScript + Tailwind
- `@notionhq/client` (Notion API), `dayjs`, `swr`
- Deploy: Vercel (cron definido en `vercel.json`)

## Estructura clave

- `models/TareaCasa.ts`, `models/Workouts.ts`, `models/WorkoutSession.ts` — tipos de la DB de Notion
- `services/notion.ts`, `services/telegram.ts` — integraciones
- `pages/api/cron/daily.ts` — endpoint del cron diario (Edge runtime)
- `pages/index.tsx`, `pages/workouts.tsx` — UI

## Estado actual

**Dormido / deshabilitado.** El cron daily tiene toda la lógica comentada — solo loguea
"Daily cron job is disabled" (`pages/api/cron/daily.ts:12`).

## Deuda técnica / notas

- README y `package.json` aún son del template de Vercel (name "cron", repositorio apuntando a vercel/examples)
- Stack viejo: Next 14, TS 4.9, Node engines 22.x
- Requiere env vars: `NOTION_TOKEN`, `NOTION_DB_TASKS_ID`, `NOTION_DB_WORKOUTS_ID`, `TELEGRAM_CHAT_ID`, `TELEGRAM_TOKEN`

## Próximo paso (si se reactiva)

1. Limpiar rastros del template (README, package.json)
2. Descomentar/reactivar la lógica del cron en `pages/api/cron/daily.ts`
3. Configurar env vars y probar el digest end-to-end

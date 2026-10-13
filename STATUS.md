# STATUS — home-tasks-manager

Actualizado: 2026-10-12

## Qué es

App de gestión de tareas del hogar: Next.js (Pages Router)
que lee tareas recurrentes desde una DB de **Notion** (`TareaCasa`, `Workouts`, `WorkoutSession`)
y manda un digest diario por **Telegram** vía Vercel Cron (`0 8 * * *`).

## Stack

- Next.js 16 (Pages Router) + React 19 + TypeScript 5.9 + Tailwind 4
- `@notionhq/client` 5 (query vía `dataSources.query` — la API de databases cambió en 2025-09-03), `dayjs`, `swr`
- ESLint 9 con flat config (`eslint.config.mjs`)
- Deploy: Vercel (cron definido en `vercel.json`), runtime Node.js 22

## Estructura clave

- `models/TareaCasa.ts`, `models/Workouts.ts`, `models/WorkoutSession.ts` — tipos de la DB de Notion
- `services/notion.ts`, `services/telegram.ts` — integraciones
- `pages/api/cron/daily.ts` — endpoint del cron diario (runtime Node.js; Edge deprecado en Next 16)
- `pages/index.tsx`, `pages/workouts.tsx` — UI

## Estado actual

**Parcialmente activo.** Cron deshabilitado: el digest diario por Telegram no corre
(la lógica en `pages/api/cron/daily.ts:4` está comentada y solo loguea). Pero la
**app sigue deployada y navegable en Vercel** (`home-tasks-manager.vercel.app`,
verificado 2026-10-12): la parte de **workouts funciona** — `pages/workouts.tsx`
lee y registra sesiones contra la DB de Notion sin depender del cron.

## Deuda técnica / notas

- README aún es del template de Vercel
- Requiere env vars: `NOTION_TOKEN`, `NOTION_DB_TASKS_ID`, `NOTION_DB_WORKOUTS_ID`, `TELEGRAM_CHAT_ID`, `TELEGRAM_TOKEN`
- Warning de `react-hooks/exhaustive-deps` en el timer de `workouts.tsx` (preexistente, no bloquea)

## Próximo paso (si se reactiva)

1. Reescribir el README
2. Descomentar/reactivar la lógica del cron en `pages/api/cron/daily.ts`
3. Configurar env vars y probar el digest end-to-end

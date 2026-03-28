# Legend Farm Shop

## Deployment target

This project is intended to be deployed on `Vercel`.

Production deployment must include the required environment variables for:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SENTRY_DSN`
- `NEXT_PUBLIC_SENTRY_DSN`
- `SENTRY_ORG`
- `SENTRY_PROJECT`

Boutique en ligne de Legend Farm, construite avec `Next.js 15`, `TypeScript`, `Tailwind CSS`, `shadcn/ui` et `Supabase`.

## Demarrage

```bash
npm install
npm run dev
```

## Principes

- Base technique proche de `legend-farm`, avec un socle plus propre et des versions figees.
- Boutique publique + espace client + back-office shop.
- Journal d'avancement maintenu dans `IMPLEMENTATION_LOG.md`.

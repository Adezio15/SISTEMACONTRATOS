# Sistema de Gestao e Acompanhamento de Contratos

Sistema interno para acompanhamento de contratos do Sesc RN, com Express, EJS, PostgreSQL/Neon e deploy previsto no Railway.

## Requisitos

- Node.js 20+
- PostgreSQL Neon
- Variaveis configuradas conforme `.env.example`

## Execucao local

```bash
npm install
copy .env.example .env
npm run migrate
npm run seed
npm run dev
```

Usuario inicial padrao do seed:

- Matricula: `admin`
- Senha: `Admin@123456`

Altere esses valores no `.env` antes do seed em ambiente real.

## Scripts

```bash
npm run dev
npm start
npm run migrate
npm run seed
npm test
npm run verify
```

## Neon

Use `DATABASE_URL` para conexao pooled da aplicacao e `DATABASE_DIRECT_URL` para migrations. Ambas devem usar `sslmode=require`.

## Railway

Configure:

- `NODE_ENV=production`
- `PORT`
- `DATABASE_URL`
- `DATABASE_DIRECT_URL`
- `SESSION_SECRET`
- `APP_URL`
- `TZ=America/Fortaleza`
- `JOBS_ENABLED=true`

Comando de start:

```bash
npm start
```

Antes do primeiro deploy, execute as migrations no ambiente:

```bash
npm run migrate
npm run seed
```

## Healthchecks

- `GET /healthz`: status simples do app.
- `GET /readyz`: checa conexao com banco.
- `/admin/saude-da-base`: tela administrativa com ultima importacao e volume da base.

## Fluxo de importacao

A importacao segue:

`upload -> validacao -> previa -> confirmacao -> upsert -> auditoria`

Nenhuma alteracao definitiva ocorre antes da confirmacao.

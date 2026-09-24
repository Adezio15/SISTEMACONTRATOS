# Sistema de Gestao e Acompanhamento de Contratos

Sistema interno para acompanhamento de contratos do Sesc RN, com Express, EJS, PostgreSQL/Neon e deploy previsto no Railway.

## Requisitos

- Node.js 20+
- Docker Desktop para banco local
- PostgreSQL Neon para producao
- Variaveis configuradas conforme `.env.example`

## Execucao local

```bash
npm install
copy .env.example .env
npm run local:setup
npm run dev
```

O comando `npm run local:setup` sobe o PostgreSQL local via Docker, executa migrations, seeds e cria/atualiza um usuario local.

Se voce ja tem PostgreSQL instalado no Windows, use:

```bash
npm run local:setup:windows
```

Esse comando pede a senha do usuario `postgres`, cria o banco `sesc_contratos`, cria o usuario `sesc_contratos` e executa migrations/seeds.

Credenciais locais padrao:

- Matricula: `local`
- Senha: `Local@123456`

Usuario administrador criado pelo seed:

- Matricula: `admin`
- Senha: `Admin@123456`

Para controlar somente o banco local:

```bash
npm run db:up
npm run db:logs
npm run db:down
```

## Banco local

O banco local roda em Docker com:

```text
DATABASE_URL=postgresql://sesc_contratos:local_dev_password@localhost:5432/sesc_contratos
DATABASE_DIRECT_URL=postgresql://sesc_contratos:local_dev_password@localhost:5432/sesc_contratos
```

As migrations continuam sendo a fonte oficial da estrutura do banco. Nao crie tabelas manualmente.

## Neon

Em producao, configure no Railway:

```text
DATABASE_URL=postgresql://USER:PASSWORD@HOST-pooler.neon.tech/DBNAME?sslmode=require
DATABASE_DIRECT_URL=postgresql://USER:PASSWORD@HOST.neon.tech/DBNAME?sslmode=require
```

Use `DATABASE_URL` para conexao pooled da aplicacao e `DATABASE_DIRECT_URL` para migrations. Ambas devem usar `sslmode=require`.

Antes do primeiro deploy, execute no ambiente de producao:

```bash
npm run migrate
npm run seed
```

Altere `SEED_ADMIN_PASSWORD` e `SESSION_SECRET` antes do seed em ambiente real.

## Scripts

```bash
npm run db:up
npm run db:down
npm run db:setup:windows
npm run local:setup
npm run local:setup:windows
npm run dev
npm start
npm run migrate
npm run seed
npm test
npm run verify
```

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

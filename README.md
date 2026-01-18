# Fynancee

> Plataforma de visao financeira e contabil para controladorias.

Fynancee organiza o fluxo de caixa, projecoes e fechamentos para dar clareza
operacional e apoiar decisoes com dados simples de entender.

## Visao do produto

- Clareza do saldo liquido em conta.
- Fluxo de caixa diario e mensal com previsao.
- Fechamento mensal/trimestral com resumo de saude.
- Base pronta para importacao de dados (futuro CSV).

## Conceitos centrais

- Tenant: a controladoria (organizacao principal).
- Client: empresa atendida pela controladoria.
- User: usuario da controladoria ou do cliente.
- Roles:
  - Controladoria: owner, admin, analyst
  - Cliente: client_admin, client_viewer

## Regras de negocio (base)

- Entradas e saidas compoem o fluxo.
- Provisoes entram na previsao do caixa.
- Dia do furo = primeiro dia com saldo projetado negativo.
- Fechamento mensal destaca dias de baixo faturamento.
- Fechamento trimestral indica saude geral.

## Funcionalidades atuais

- Google OAuth (idToken) + JWT interno.
- RBAC com escopo por tenant e client.
- Cadastro de controladoria, clientes e usuarios.
- Lancamentos financeiros:
  - entries (receitas/despesas)
  - provisions (provisoes futuras)
  - balances (saldo)
- Cashflow diario e mensal com:
  - dayOfCashShort
  - runway (dias/meses sem receita)
- Fechamento mensal/trimestral com snapshot:
  - healthy, warning, critical
- Auditoria basica:
  - origem do dado (manual/import)
  - usuario criador

## Fluxo operacional (padrao)

1) Bootstrap do owner e da controladoria.
2) Owner cria usuarios internos (admin/analyst).
3) Controladoria cria clientes (empresas atendidas).
4) Controladoria cria usuarios do cliente (opcional).
5) Entrada de dados:
   - balances (saldo inicial)
   - entries (receitas/despesas)
   - provisions (compromissos futuros)
6) Visualizacao:
   - cashflow diario/mensal
   - fechamento mensal/trimestral

## Endpoints principais

Auth:
- POST /v1/auth/google
- GET /v1/auth/me

Tenants/Users:
- POST /v1/tenants
- GET /v1/tenants/:tenantId
- POST /v1/tenants/:tenantId/users

Clients:
- POST /v1/tenants/:tenantId/clients
- GET /v1/tenants/:tenantId/clients/:clientId

Finance:
- POST /v1/clients/:clientId/entries
- POST /v1/clients/:clientId/provisions
- POST /v1/clients/:clientId/balances
- GET /v1/clients/:clientId/cashflow
- POST /v1/clients/:clientId/closings
- GET /v1/clients/:clientId/closings

## Modelo (visao rapida)

Tenant (Controladoria)
  |-- Users (owner/admin/analyst)
  |-- Clients (empresas atendidas)
        |-- Users (client_admin/client_viewer)

## Como rodar

```bash
npm install
```

Crie um arquivo `.env` baseado em `.env.example`:

```bash
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=1234
DB_NAME=postgres
JWT_SECRET=change-me
JWT_EXPIRES_IN=1d
GOOGLE_CLIENT_ID=your-google-client-id
```

Rode migrations e o bootstrap do owner:

```bash
npm run migration:run
BOOTSTRAP_OWNER_EMAIL=owner@exemplo.com npm run seed:bootstrap
```

Suba o projeto:

```bash
npm run start:dev
```

## Scripts uteis

- `npm run migration:generate -- src/migrations/Nome`
- `npm run migration:run`
- `npm run seed:bootstrap`

## Roadmap (curto)

- Importador CSV (bootstrap de dados).
- Indicadores de estoque/reservas.
- Fechamento anual e insights executivos.

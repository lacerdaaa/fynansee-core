# Fynancee

Plataforma de visao financeira e contabil para controladorias. O foco e dar clareza
na tomada de decisao com fluxo de caixa diario/mensal, previsao e fechamento por
periodo.

## Visao do produto

- Entrega clareza sobre saldo, projecao e dias criticos.
- Saldo e sempre liquido em conta.
- Fluxo considera entradas, saidas e provisoes.
- Fechamento mensal/trimestral com resumo de saude.

## Regras de negocio (base)

- Entradas e saidas compoem o fluxo.
- Provisoes entram na previsao do caixa.
- Dia do furo = primeiro dia em que o saldo projetado fica negativo.
- Fechamento mensal destaca dias de baixo faturamento.
- Fechamento trimestral indica saude geral.

## Funcionalidades atuais

- Google OAuth (idToken) + JWT interno.
- RBAC com papeis de controladoria e cliente.
- Cadastro de controladoria, clientes e usuarios.
- Lancamentos financeiros:
  - entries (receitas/despesas)
  - provisions (provisoes futuras)
  - balances (saldo)
- Cashflow diario e mensal com:
  - dayOfCashShort
  - runway (dias/meses sem receita)
- Fechamento mensal/trimestral com snapshot e status:
  - healthy, warning, critical
- Auditoria basica: origem do dado (manual/import) e usuario criador.

## Modelo de acesso

- Tenant = controladoria (base para multi-tenant, mesmo sendo uso interno).
- Client = empresa atendida.
- User pode ser controladoria ou cliente.
- Roles:
  - Controladoria: owner, admin, analyst
  - Cliente: client_admin, client_viewer

## Rotas principais (resumo)

- Auth:
  - POST /v1/auth/google
  - GET /v1/auth/me
- Tenants/Users:
  - POST /v1/tenants
  - GET /v1/tenants/:tenantId
  - POST /v1/tenants/:tenantId/users
- Clients:
  - POST /v1/tenants/:tenantId/clients
  - GET /v1/tenants/:tenantId/clients/:clientId
- Finance:
  - POST /v1/clients/:clientId/entries
  - POST /v1/clients/:clientId/provisions
  - POST /v1/clients/:clientId/balances
  - GET /v1/clients/:clientId/cashflow
  - POST /v1/clients/:clientId/closings
  - GET /v1/clients/:clientId/closings

## Como rodar

```bash
npm install
```

Crie um arquivo `.env` baseado em `.env.example` e ajuste o banco:

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

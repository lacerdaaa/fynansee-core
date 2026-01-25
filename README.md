Fynancee
========
Plataforma de visão financeira e contábil para controladorias e seus clientes.

Visão geral
-----------
Fynancee existe para dar clareza na tomada de decisão. O foco é transformar o fluxo
de caixa em uma visão simples e acionável, com projeções de 6 a 12 meses e destaque
para períodos de risco (dias ou meses críticos).

Regras de negócio (base)
------------------------
- Saldo = valor líquido em conta (não considera impostos neste modelo base).
- Todas as saídas têm o mesmo peso (pode variar por negócio/cliente).
- Fechamento mensal destaca dias de baixo faturamento.
- Fechamento trimestral avalia a saúde da empresa.
- Projeção padrão: 6 meses (configurável para 12+ no futuro).

Papéis e acesso (RBAC)
----------------------
- Autenticação: Google OAuth + login com e-mail/senha.
- RBAC por tipo e função.
  - UserType: controller | client
  - TenantRole: owner | admin | analyst
  - ClientRole: client_admin | client_viewer

Convites e recuperação de senha
-------------------------------
- Convites para usuários de controladoria e clientes com token expirável.
- Aceite de convite cria senha e ativa a associação.
- Reset de senha via token (retornado pela API neste estágio).

Domínio e entidades principais
------------------------------
- Tenant: a controladoria (topo da hierarquia).
- Users: usuários da controladoria e do cliente.
- Clients: empresas atendidas pela controladoria.
- Finance: entradas, saídas (despesas), provisões e saldos.
- Closings: snapshots mensais/trimestrais com resumo e saúde.
- Patrimonial: estoque e reservas (indicadores).
- Imports: ingestão de CSV em lote (alta escala).

Fluxo padrão (alto nível)
-------------------------
1) Controladoria cria o tenant e seus usuários.
2) Controladoria cadastra clientes e vincula usuários.
3) Dados financeiros entram via API ou importação CSV.
4) Sistema gera fechamentos e indicadores.
5) Cliente visualiza sua saúde e projeções com clareza.

Importação CSV (alto volume)
----------------------------
1) API recebe o CSV e salva no Azure Blob Storage.
2) API cria um import_batch e publica mensagem no RabbitMQ.
3) Worker consome a fila, faz stream do CSV e grava import_rows em lote.
4) import_batch atualiza status, headers e contagem de linhas.

Stack técnica
-------------
- Backend: NestJS + TypeORM
- Banco: Postgres
- Filas: RabbitMQ
- Storage: Azure Blob Storage
- Auth: Google OAuth + JWT

Configuração local (Docker)
---------------------------
Suba os serviços básicos:
```bash
docker compose up -d
```

Arquivo: `docker-compose.yml` (Postgres + RabbitMQ).

Variáveis de ambiente
----------------------
Veja `.env.example` para copiar e ajustar. Principais variáveis:

- `PORT` - Porta da API (ex: 3000)
- `DB_HOST` - Host do Postgres
- `DB_PORT` - Porta do Postgres
- `DB_USER` - Usuário do Postgres
- `DB_PASSWORD` - Senha do Postgres
- `DB_NAME` - Nome do banco
- `JWT_SECRET` - Chave do JWT
- `JWT_EXPIRES_IN` - Expiração do JWT (ex: 1d)
- `GOOGLE_CLIENT_ID` - Client ID do OAuth Google
- `BOOTSTRAP_TENANT_NAME` - Nome do tenant inicial
- `BOOTSTRAP_OWNER_NAME` - Nome do owner inicial
- `BOOTSTRAP_OWNER_EMAIL` - E-mail do owner inicial
- `BOOTSTRAP_OWNER_PASSWORD` - Senha do owner inicial (opcional)
- `RABBITMQ_URL` - URL do RabbitMQ (ex: amqp://localhost)
- `IMPORT_QUEUE_NAME` - Nome da fila de importação
- `IMPORT_BATCH_SIZE` - Lote de inserção de linhas
- `IMPORT_PREFETCH` - Prefetch do consumidor
- `IMPORT_MAX_FILE_SIZE` - Tamanho máximo do CSV (bytes)
- `AZURE_STORAGE_CONNECTION_STRING` - Conexão do Azure Blob
- `AZURE_STORAGE_CONTAINER` - Container do Blob

Exemplo rápido (.env)
----------------------
```bash
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=1234
DB_NAME=fynansee
JWT_SECRET=change-me
JWT_EXPIRES_IN=1d
GOOGLE_CLIENT_ID=your-google-client-id
BOOTSTRAP_TENANT_NAME=Primary Controladoria
BOOTSTRAP_OWNER_NAME=Owner
BOOTSTRAP_OWNER_EMAIL=owner@example.com
BOOTSTRAP_OWNER_PASSWORD=change-me
RABBITMQ_URL=amqp://localhost
IMPORT_QUEUE_NAME=imports.csv
IMPORT_BATCH_SIZE=1000
IMPORT_PREFETCH=1
IMPORT_MAX_FILE_SIZE=50000000
AZURE_STORAGE_CONNECTION_STRING=your-azure-connection-string
AZURE_STORAGE_CONTAINER=your-container
```

Quickstart
----------
```bash
npm install
cp .env.example .env
npm run migration:run
npm run seed:bootstrap
npm run start:dev
```

Worker de importação
--------------------
```bash
npm run worker:imports
```

Scripts úteis
-------------
- `npm run migration:run` - aplica migrations
- `npm run seed:bootstrap` - cria tenant + owner inicial
- `npm run worker:imports` - processa importação CSV

Observações
-----------
- A importação CSV é assíncrona e pensada para dezenas de milhares de linhas.
- O modelo atual prioriza fluxo de caixa e saúde financeira; impostos podem ser
  acoplados em uma fase posterior.

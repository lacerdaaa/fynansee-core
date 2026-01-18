   ______                 __
  / ____/___  _________ _/ /_____  _____
 / /_  / __ \/ ___/ __ `/ //_/ _ \/ ___/
/ __/ / /_/ / /  / /_/ / ,< /  __/ /
/_/    \____/_/   \__,_/_/|_|\___/_/

Fynancee
========
Plataforma de visao financeira e contabil para controladorias e seus clientes.

Why
---
Clareza para decisao: fluxo de caixa com previsao de 6 a 12 meses, destacando
os dias/meses criticos e o risco de furo de caixa.

Business rules (base)
---------------------
- Saldo = valor liquido em conta (nao considera impostos aqui).
- Todas as saidas tem o mesmo peso (pode haver excecoes por negocio).
- Fechamento mensal destaca dias de baixo faturamento.
- Fechamento trimestral avalia saude da empresa.
- Projecao padrao: 6 meses (configuravel para 12).

Core concepts
-------------
- Tenant: a controladoria (topo da hierarquia).
- Users: usuarios da controladoria e do cliente.
- Clients: empresas atendidas pela controladoria.
- Finance data: entradas, saidas (despesas), provisoes, saldos.
- Closings: snapshots mensais/trimestrais com resumo e saude.
- Patrimonial: estoque e reservas (indicadores).
- Imports: ingestao de CSV em lote (alta escala).

Access and auth
---------------
- OAuth Google + JWT.
- RBAC por tipo e funcao.
  - UserType: controller | client
  - TenantRole: owner | admin | analyst
  - ClientRole: client_admin | client_viewer

Import pipeline (CSV high volume)
---------------------------------
1) API recebe CSV, salva no Azure Blob Storage.
2) API cria import_batch e publica mensagem no RabbitMQ.
3) Worker consome fila, stream do CSV e grava import_rows em lote.
4) import_batch atualiza status, headers e contagem de linhas.

Local setup
-----------
1) Postgres
2) RabbitMQ (ou outro broker compativel)
3) Azure Storage (container)
4) Vars de ambiente (veja `.env.example`)

Quickstart
----------
```bash
npm install
cp .env.example .env
npm run migration:run
npm run seed:bootstrap
npm run start:dev
```

Worker (import)
---------------
```bash
npm run worker:imports
```

Key scripts
-----------
- `npm run migration:run` - aplica migrations
- `npm run seed:bootstrap` - cria tenant + owner inicial
- `npm run worker:imports` - worker de importacao CSV

Project status
--------------
Base pronta para evoluir regras de negocio e modelos de importacao.
Proximos passos naturais: mapeamento de colunas CSV e reconciliacao contabilidade.

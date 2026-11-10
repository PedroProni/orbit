# Orbit API

API do Orbit, a ferramenta de gestão de tarefas do time. Feita com NestJS, TypeScript e MongoDB, em camadas de DDD (domínio, aplicação, infraestrutura e apresentação). O guia de arquitetura está em [`ARCHITECTURE.md`](ARCHITECTURE.md).

## Como rodar

Pré-requisitos: Node 22, Docker.

```bash
docker compose up -d mongodb minio
cd application
cp .env.example .env
npm ci
npm run build
npm run start
```

A pilha completa (Mongo, MinIO, API e front) sobe com `docker compose up -d` na raiz. As portas podem ser trocadas com `ORBIT_MONGO_PORT`, `ORBIT_MINIO_PORT`, `ORBIT_MINIO_CONSOLE_PORT`, `ORBIT_API_PORT` e `ORBIT_WEB_PORT`.

Testes:

```bash
npm test
npm run test:e2e
```

Swagger em `http://localhost:3000/api-docs`, protegido por `SWAGGER_AUTH_USERNAME` e `SWAGGER_AUTH_PASSWORD`.

## Variáveis de ambiente

Os valores de exemplo estão em [`application/.env.example`](application/.env.example). A coluna "Sem a variável" mostra o que o código usa quando a variável não existe; a coluna "No `.env.example`" mostra o valor do arquivo de exemplo, pensado para o ambiente local.

| Variável | Para que serve | Sem a variável | No `.env.example` |
|---|---|---|---|
| `MONGODB_URI` | Conexão com o MongoDB | `mongodb://localhost:27017/orbit` | `mongodb://localhost:27017/orbit` |
| `JWT_SECRET` | Assinatura da sessão (mínimo de 32 caracteres aleatórios). Obrigatória com `NODE_ENV=production` | segredo fixo só para desenvolvimento; com `NODE_ENV=production` a API não sobe | valor a trocar |
| `ALLOWED_EMAIL_DOMAIN` | Domínio de e-mail da empresa, usado no convite (e-mails de fora viram convidados externos) e no login pela Cloudflare Access | vazio | `example.com` |
| `CF_ACCESS_TEAM_DOMAIN`, `CF_ACCESS_AUD` | Login pela Cloudflare Access na frente do front (opcional) | vazio | vazio |
| `ENABLE_DEV_LOGIN` | Libera o login de desenvolvimento sem senha. Nunca ligar fora do ambiente local | `false` | `false` |
| `SESSION_COOKIE_INSECURE` | Tira o `Secure` do cookie de sessão, só para ambiente local sem HTTPS | `false` | `false` |
| `TRUST_PROXY_HOPS` | Quantos proxies confiáveis existem antes da API (o rewrite do front conta 1). Com `0` atrás de um proxy, todos os clientes dividem o mesmo limite de login | `0` | `1` |
| `GITHUB_TOKEN` | Token fine-grained só de leitura para a sincronização do GitHub. Vazio desliga a sincronização | vazio | vazio |
| `GITHUB_REPOSITORIES` | Repositórios sincronizados, separados por vírgula (`owner/nome`) | vazio | os três repositórios do Orbit |
| `GITHUB_SYNC_INTERVAL_MS` | Intervalo da sincronização; `0` desliga o agendador | `300000` | `300000` |
| `GITHUB_API_URL` | Só para teste local contra um GitHub falso | `https://api.github.com` | vazio (usa `https://api.github.com`) |
| `GITHUB_WEBHOOK_SECRET` | Segredo do webhook do GitHub (opcional) | vazio | vazio |
| `AUTOMATION_SECRET_KEY` | Chave AES-256-GCM em base64 (32 bytes) que cifra o segredo dos webhooks de automação. Sem ela, automações com webhook são recusadas | vazio | vazio |
| `AUTOMATION_DATE_INTERVAL_MS` | Intervalo da verificação de gatilhos por data; `0` desliga | `60000` | `60000` |
| `AUTOMATION_WEBHOOK_ALLOW_PRIVATE` | Libera webhooks para http e endereços privados, só em desenvolvimento. Ignorada com `NODE_ENV=production` | `false` | `false` |
| `SCHEDULER_INTERVAL_MS` | Intervalo do agendador de recorrências | `60000` | `60000` |
| `S3_ENDPOINT`, `S3_PUBLIC_ENDPOINT` | Endereço do armazenamento (MinIO local). Na AWS ficam vazios e a API usa a task role. `S3_PUBLIC_ENDPOINT` vazio repete o `S3_ENDPOINT` | vazio | `http://localhost:9000` |
| `S3_REGION` | Região do armazenamento | `us-east-1` | `us-east-1` |
| `S3_BUCKET` | Bucket dos anexos | `orbit-files` | `orbit` |
| `S3_ACCESS_KEY`, `S3_SECRET_KEY` | Chaves do MinIO local. Vazias na AWS | vazio | chaves do MinIO local |
| `PRESIGN_TTL_SECONDS` | Validade das URLs assinadas de anexo | `300` | `300` |
| `LOCAL_DOMAIN` | Origem do front local aceita no CORS | `http://localhost:3000` | `http://localhost:3001` |
| `MOBILE_DOMAIN`, `PROD_DOMAIN` | Outras origens aceitas no CORS | vazio | vazio |
| `SWAGGER_AUTH_USERNAME`, `SWAGGER_AUTH_PASSWORD` | Acesso ao Swagger. Troque fora do ambiente local | `admin`, `admin` | `admin`, `admin` |
| `PORT` | Porta HTTP | `3000` | `3000` |
| `BIND_HOST` | Interface em que a API escuta. Vazio escuta em todas; use `127.0.0.1` quando só um proxy local deve alcançar a API | vazio | vazio |
| `NODE_ENV` | Ambiente. Só `production` liga as travas de produção (segredo obrigatório, webhooks privados bloqueados, logs reduzidos) | vazio (tratado como desenvolvimento) | `development` |

## Acesso

- Login por e-mail e senha, com sessão em cookie `HttpOnly`, limite de tentativas por endereço e lista de sessões com encerramento remoto.
- Papéis: dono, admin, membro, visualizador (só leitura) e convidado (só as listas compartilhadas com ele).
- O link de definição de senha é gerado pela própria API (`POST /users/:id/access-link`, na administração) ou pela linha de comando, que só aceita Mongo local:

```bash
node dist/cli/access/issue-access-link.js --mongo-uri <uri> --base-url <url do front> --out <arquivo> --email <e-mail>
```

## Funcionalidades (passos 4 a 7)

### Passo 4: administração, criação de tarefas e GitHub
- Área de administração com espaços, pastas, listas, status, campos personalizados e grupos.
- Criação de tarefa pelo "+" no quadro, na lista e no modal, com tipo de tarefa, datas, prioridade, responsáveis, subtarefas, checklist, dependências e anexos.
- Filtro por responsável com contagem (`GET /tasks/assignee-counts`) e filtro de não atribuídas, usados no quadro largo e na visão de todas as tarefas.
- Links fixos por tarefa (GitHub, Figma, Notion e pasta de prints) e contagem de anexos com capa no quadro.
- Integração com o GitHub só de leitura: pull requests vinculados por webhook ou por URL, checks, autor, branches e commits, com sincronização agendada e atualização manual (`GET /tasks/:id/github`). O token nunca sai da API.

### Passo 5: automações, papéis, formulários, modelos e tokens
- Automações com gatilhos (tarefa criada, mudança de status, mudança de prioridade, responsável adicionado e data atingida) e ações (atribuir, adicionar etiqueta, mudar prioridade, mudar status, comentar, notificar e webhook assinado). Os webhooks passam por proteção contra SSRF e o segredo fica cifrado com AES-GCM. Cada execução fica no histórico.
- Papel visualizador e troca de papel pelo admin, com bloqueio de escrita em todas as rotas que alteram dados.
- Formulários públicos (`/f/<chave>`) que criam tarefas numa lista, com pausa e troca de chave.
- Modelos de tarefa usados na criação.
- Tokens de API exibidos uma única vez: o admin vê os próprios, o dono vê todos.

### Passo 6: auditoria e visão geral
- Log de auditoria com filtros por período, ação, ator e entidade, e paginação por cursor (`GET /audit-logs`).
- Status da integração do GitHub e das entregas de webhook.
- Resumo do workspace para a página geral da administração.

### Passo 7: acabamento
- Acabamento visual das telas de painéis, metas, chat, documentos, caixa de entrada e conta no front, sem mudança de contrato na API.

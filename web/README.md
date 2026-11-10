# Orbit Web

Front do Orbit, a ferramenta de gestão de tarefas do time. Feito com Next.js (App Router), React, TanStack Query, Zustand e next-intl, com textos em inglês e português (`messages/en.json` e `messages/pt.json`).

## Como rodar

Pré-requisitos: Node 22 e a [Orbit API](https://github.com/PedroProni/orbit-api) rodando.

```bash
npm ci
ORBIT_API_URL=http://localhost:3000 npm run dev
```

O front chama a API pelo próprio domínio em `/backend/*`, que o Next reescreve para `ORBIT_API_URL`. O cookie de sessão fica no domínio do front.

Produção:

```bash
ORBIT_API_URL=http://localhost:3000 npm run build
npm run start
```

O rewrite é gravado no build: um build feito para uma API não serve para outra.

Verificações:

```bash
npm test
npm run lint
npx tsc --noEmit
```

## Variáveis de ambiente

| Variável | Para que serve | Padrão |
|---|---|---|
| `ORBIT_API_URL` | Endereço da API para o rewrite de `/backend/*`. Lida no build | `http://localhost:56510` |
| `NEXT_PUBLIC_DEV_LOGIN` | `true` mostra o login de desenvolvimento sem senha. Só funciona com a API em `ENABLE_DEV_LOGIN=true`; nunca ligar fora do ambiente local | desligado |
| `NEXT_PUBLIC_ACCESS_LOGIN` | `true` usa o login pela Cloudflare Access em vez do formulário de senha | desligado |
| `ORBIT_BUILD_SHA` | Versão devolvida por `/health` | `dev` |

## Telas

- Listas (`/lists/:id`) em lista, quadro e calendário, com filtros, visões salvas, edição em massa e criação pelo "+".
- Todas as tarefas (`/all-tasks`), tarefa (`/t/:id`), caixa de entrada, painéis, metas, chat, documentos e conta.
- Administração (`/admin/*`): visão geral, espaços, status, tipos de tarefa, campos, grupos, pessoas, automações, formulários, modelos, tokens de API, auditoria e GitHub.
- Páginas públicas: login, esqueci a senha, definir senha e formulário público (`/f/:chave`).

## Funcionalidades (passos 4 a 8)

### Passo 4: administração, criação de tarefas e GitHub
- Área de administração para a estrutura do workspace (espaços, pastas, listas, status, campos e grupos).
- Criação de tarefa no estilo "+": composer no topo do quadro, linha na lista e modal com comandos `/`, extras (subtarefas, checklist, dependências e anexos) e aviso de criação com "Ver tarefa" e "Copiar URL".
- Quadro com colunas largas, rolagem horizontal, filtro por responsável com contagem e a visão de todas as tarefas.
- Modal de tarefa compacto, com links fixos (GitHub, Figma, Notion e prints), comentários e atividade na mesma linha do tempo.
- Tabela e quadro com status, prioridade, responsáveis, indicadores e capa do primeiro anexo de imagem.
- Seção do GitHub na tarefa com checks, autor, branches, commits e atualização manual.

### Passo 5: automações, papéis, formulários, modelos e tokens
- Página de automações com gatilhos, ações, segredo do webhook exibido uma vez e histórico de execuções.
- Papel visualizador: telas em modo leitura e troca de papel pela administração.
- Formulários públicos com pausa e troca de chave, modelos de tarefa na criação e tokens de API exibidos uma única vez.

### Passo 6: auditoria e visão geral
- Log de auditoria com filtros por período, ação, ator e entidade, e "Carregar mais".
- Status da integração do GitHub e das entregas de webhook.
- Visão geral do workspace na administração.

### Passo 7: acabamento
- Painéis, metas, chat, documentos, caixa de entrada e conta com cabeçalho padrão, esqueleto de carregamento, erro com "Tentar de novo", estado vazio com dica conforme o papel e confirmação antes de excluir ou arquivar.
- Falha ao salvar mostra um aviso e mantém o que a pessoa digitou.
- Chat e documentos no celular mostram uma coluna por vez, com botão de voltar.
- No log de auditoria, um período invertido esconde a lista até a data ser corrigida.

### Passo 8: achados do uso interno
- No celular, o título da tarefa na lista quebra em até duas linhas e a busca do cabeçalho mostra um texto curto.
- Avisos no topo, abaixo do cabeçalho: canto superior direito no computador e largura toda no celular, com o recuo da área segura.
- O formulário de meta volta para os valores padrão depois de criar.

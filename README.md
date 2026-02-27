# ERP Estúdio Cruzeta

## Visão Geral

Este é um sistema de ERP simplificado para administração de inventário, solicitações de fabricação e gerenciamento de usuários para o **Estúdio Cruzeta**. A aplicação é totalmente containerizada utilizando Docker e Docker Compose para facilitar a configuração e a implantação do ambiente de desenvolvimento.

---

## Tecnologias Utilizadas

- **Frontend:**
  - React 19 com TypeScript
  - Vite como ambiente de desenvolvimento e build
  - React Router para navegação
  - Tailwind CSS (através de classes utilitárias) para estilização

- **Backend:**
  - Node.js com Express.js
  - PostgreSQL como banco de dados

- **Containerização:**
  - Docker
  - Docker Compose

- **Gerenciamento de Banco de Dados:**
  - Adminer (acessível via navegador)

---

## Estrutura do Projeto

```
/
├── server/             # Contém a API backend (Express.js)
├── components/         # Componentes React reutilizáveis
├── contexts/           # Provedores de contexto React (Autenticação, Estado Global do ERP)
├── pages/              # Componentes de página (Dashboard, Inventário, etc.)
├── .env                # Arquivo para variáveis de ambiente (NÃO deve ser versionado)
├── docker-compose.yml  # Orquestração dos containers Docker
├── Dockerfile          # Definição do container para o frontend
└── README.md           # Esta documentação
```

---

## Configuração do Ambiente

### Pré-requisitos
- Docker e Docker Compose instalados em sua máquina.

### 1. Variáveis de Ambiente

Crie um arquivo chamado `.env` na raiz do projeto. Você pode copiar o conteúdo abaixo e ajustá-lo se necessário.

```env
# --- FRONTEND ---
VITE_API_BASE_URL=http://localhost:5000
GEMINI_API_KEY=

# --- BACKEND (API) ---
PORT=5000

# --- BANCO DE DADOS (POSTGRES) ---
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_USER=admin
POSTGRES_PASSWORD=senha_super_secreta
POSTGRES_DB=meu_banco_de_dados

# --- CREDENCIAIS PADRÃO ---
DEFAULT_ADMIN_EMAIL=admin@estudiocruzeta.com.br
DEFAULT_ADMIN_PASSWORD=Mudar@123
```

### 2. Iniciando a Aplicação

Com o Docker em execução, rode o seguinte comando na raiz do projeto:

```bash
docker-compose up --build -d
```
- O argumento `--build` força a reconstrução das imagens, o que é importante após alterações no código ou dependências.
- O argumento `-d` (detached mode) executa os containers em segundo plano.

Para parar a aplicação, use:
```bash
docker-compose down
```

---

## Serviços Disponíveis

Após iniciar os containers, os seguintes serviços estarão acessíveis:

- **Aplicação Frontend (ERP):**
  - **URL:** `http://localhost:3000`

- **API Backend:**
  - **URL:** `http://localhost:5000`

- **Adminer (Gerenciador de Banco de Dados):**
  - **URL:** `http://localhost:8080`
  - Use as credenciais do banco de dados definidas no arquivo `.env` para fazer login.
    - **Sistema:** PostgreSQL
    - **Servidor:** `postgres` (nome do serviço Docker)
    - **Usuário:** `admin`
    - **Senha:** `senha_super_secreta`
    - **Banco de dados:** `meu_banco_de_dados`

---

## Credenciais Padrão

Ao iniciar a aplicação pela primeira vez, um usuário administrador padrão é criado:

- **Email:** `admin@estudiocruzeta.com.br`
- **Senha:** `Mudar@123` (ou o valor de `DEFAULT_ADMIN_PASSWORD` no seu `.env`)

---

## Recursos de Destaque

- **Relatórios Gerenciais:** Exportação de dados de estoque, pedidos e logs em formatos **PDF** (formatado para impressão) e **CSV** (para Excel).
- **Controle de Acesso:** Diferentes níveis de permissão (Administrador, Gestor, Usuário) com restrição de visualização de dados financeiros.
- **Dashboard Dinâmico:** Gráficos interativos com indicadores de saúde do estoque e valor em produção.
- **Auditoria:** Log automático de todas as ações críticas realizadas no sistema.
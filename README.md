
# Ordeminds v4

Aplicação completa (Node + Express + SQLite + páginas estáticas) com:

- Login, cadastro, verificação de e-mail (código 6 dígitos), esqueci e redefinição de senha
- Tema claro/escuro
- Dashboard com mini‑calendário, agenda do dia, tarefas, compras, contas e gráfico nativo
- Páginas dedicadas: Agenda, Tarefas, Compras, Contas, Relatórios, Perfil
- Perfil com edição de nome, endereço, troca de senha e avatar
- APIs REST simples em `/api/*` e rotas de página funcionando

## Rodar localmente

```bash
npm install
npm start
```
Abra http://localhost:3000

## Variáveis de ambiente

Crie um `.env` (ou use App Settings no Azure):

```
SESSION_SECRET=alguma-coisa-bem-grande
APP_BASE_URL=http://localhost:3000
CANONICAL_HOST=
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=contato@ordeminds.com.br
SMTP_PASS=SEU_SEGREDO
MAIL_FROM=Ordeminds <contato@ordeminds.com.br>
```

## Deploy no Azure

- Faça ZIP dessa pasta (sem `node_modules`) e publique via **Zip Deploy**.
- Defina as mesmas variáveis acima nas **Configurações do aplicativo**.
- Configure a versão do Node >= 18.
- Ponto de inicialização: `npm start`.

# Deploy para Azure (Static Web Apps ou App Service)

Este projeto é um SPA React + Vite. Abaixo dois caminhos prontos para a Azure:

## Opção A — Azure Static Web Apps (recomendado)
1. **Suba o repositório no GitHub.**
2. No portal da Azure, crie um recurso **Static Web App** (Plano Free/Standard).
3. Em **Deployment**, conecte ao seu repositório e selecione a branch (ex.: `main`).
4. Use estas configurações:
   - **App location:** `/`
   - **Output location:** `dist`
5. A pipeline GitHub Actions `/.github/workflows/azure-static-web-apps.yml` já está incluída.
   - Se preferir criar manualmente o recurso sem conectar o GitHub, crie um **token** em Static Web Apps e salve no repositório como **secret** `AZURE_STATIC_WEB_APPS_API_TOKEN`.
6. O arquivo `staticwebapp.config.json` garante o fallback do SPA e cabeçalhos de segurança.

### Variáveis de ambiente (Vite)
Se precisar de configs (ex.: Azure AD/MSAL), crie `.env` na raiz com chaves prefixadas por `VITE_`, por exemplo:
```
VITE_AAD_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
VITE_AAD_TENANT_ID=yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy
VITE_AAD_REDIRECT_URI=https://SEU_HOST/.auth/login/aad/callback
```
> Troque os valores conforme seu cenário.

## Opção B — Azure App Service (contêiner)
Incluímos um `Dockerfile` que gera build estático e serve via **nginx**.
1. Faça build da imagem localmente ou via GitHub Actions.
2. Publique no **Azure Container Registry**.
3. Crie um **App Service** (Linux) apontando para a imagem.
4. Configure a **porta 8080** nas configurações do App.
5. (Opcional) adicione **Application Settings** equivalentes às suas variáveis `VITE_` no build pipeline.

## Observações
- Como é uma SPA, qualquer rota desconhecida cai no `index.html` (configurado em `staticwebapp.config.json` e no nginx).
- Para autenticação com Azure AD usando MSAL, garanta que o **Redirect URI** está cadastrado no **Entra ID** e combina com o domínio final.
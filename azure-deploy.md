# Deploy na Azure - Ordeminds

Este guia fornece as instruções completas para hospedar o Ordeminds na Azure.

## Pré-requisitos

- Conta Azure ativa
- Azure CLI instalado
- Node.js 18+ e npm/bun instalado
- Domínio próprio configurado

## 1. Configuração do Azure AD

### Registrar aplicação no Azure AD:

1. Acesse o [Portal Azure](https://portal.azure.com)
2. Vá para **Azure Active Directory** > **App registrations**
3. Clique em **New registration**
4. Configure:
   - **Name**: Ordeminds
   - **Supported account types**: Accounts in this organizational directory only
   - **Redirect URI**: 
     - Tipo: Single-page application (SPA)
     - URL: `https://seudominio.com/login` (substitua pelo seu domínio)

### Configurar permissões:

1. Em **API permissions**, adicione:
   - Microsoft Graph > User.Read (delegated)
2. Clique em **Grant admin consent**

### Copiar configurações:

- **Application (client) ID**: Use no arquivo `src/lib/msalConfig.ts`
- **Directory (tenant) ID**: Use no arquivo `src/lib/msalConfig.ts`

## 2. Atualizar configuração da aplicação

Edite o arquivo `src/lib/msalConfig.ts`:

```typescript
import { Configuration, LogLevel } from '@azure/msal-browser';

export const msalConfig: Configuration = {
  auth: {
    clientId: 'SEU_CLIENT_ID_AQUI', // Application (client) ID
    authority: 'https://login.microsoftonline.com/SEU_TENANT_ID_AQUI', // Directory (tenant) ID
    redirectUri: 'https://seudominio.com/login', // Seu domínio
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) {
          return;
        }
        switch (level) {
          case LogLevel.Error:
            console.error(message);
            return;
          case LogLevel.Info:
            console.info(message);
            return;
          case LogLevel.Verbose:
            console.debug(message);
            return;
          case LogLevel.Warning:
            console.warn(message);
            return;
        }
      }
    }
  }
};
```

## 3. Build da aplicação

```bash
# Instalar dependências
npm install

# Build para produção
npm run build
```

## 4. Opções de Deploy na Azure

### Opção A: Azure Static Web Apps (Recomendado)

1. No Portal Azure, crie um **Static Web App**
2. Configure:
   - **Subscription**: Sua subscription
   - **Resource group**: Crie ou use existente
   - **Name**: ordeminds-app
   - **Hosting plan**: Free
   - **Source**: GitHub (conecte seu repositório)
   - **Build Presets**: React
   - **App location**: /
   - **Build location**: dist

3. Configure domínio customizado:
   - Em **Custom domains**, adicione seu domínio
   - Configure DNS CNAME apontando para o subdomínio gerado

### Opção B: Azure App Service

1. Crie um **App Service**:
   ```bash
   az webapp create \
     --resource-group meu-resource-group \
     --plan meu-app-service-plan \
     --name ordeminds-app \
     --runtime "NODE|18-lts"
   ```

2. Deploy:
   ```bash
   # Comprimir arquivos do build
   cd dist
   zip -r ../build.zip .
   
   # Deploy via Azure CLI
   az webapp deploy \
     --resource-group meu-resource-group \
     --name ordeminds-app \
     --src-path ../build.zip
   ```

### Opção C: Azure Storage + CDN

1. Crie uma Storage Account com hosting estático habilitado
2. Upload dos arquivos da pasta `dist/`
3. Configure Azure CDN para melhor performance
4. Configure domínio customizado no CDN

## 5. Configuração de domínio e SSL

### DNS Configuration:
```
CNAME www -> ordeminds-app.azurewebsites.net
A     @   -> IP_ADDRESS_DO_AZURE
```

### SSL Certificate:
- Azure automaticamente fornece certificado SSL gratuito
- Para certificados customizados, use Azure Key Vault

## 6. Configurações adicionais

### Redirect Rules (arquivo `staticwebapp.config.json`):
```json
{
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/images/*.{png,jpg,gif}", "/css/*"]
  },
  "mimeTypes": {
    ".json": "text/json"
  },
  "globalHeaders": {
    "Cache-Control": "max-age=31536000"
  },
  "routes": [
    {
      "route": "/login",
      "rewrite": "/index.html"
    },
    {
      "route": "/app/*",
      "rewrite": "/index.html"
    }
  ]
}
```

## 7. Variáveis de ambiente

Para desenvolvimento local, crie `.env.local`:
```
VITE_AZURE_CLIENT_ID=seu_client_id
VITE_AZURE_TENANT_ID=seu_tenant_id
VITE_AZURE_REDIRECT_URI=http://localhost:8080/login
```

Para produção, configure no Azure Portal em **Configuration** > **Application settings**.

## 8. Monitoramento

Configure Application Insights:
1. Crie um recurso Application Insights
2. Adicione a connection string nas configurações da aplicação
3. Configure alertas para erros e performance

## 9. Backup e Recovery

- Configure backup automático no Azure
- Use Git para versionamento do código
- Documente todas as configurações importantes

## Comandos úteis

```bash
# Build local
npm run build

# Preview do build
npm run preview

# Deploy direto via Azure CLI
az staticwebapp deploy \
  --name ordeminds-app \
  --source ./dist

# Ver logs
az webapp log tail \
  --name ordeminds-app \
  --resource-group meu-resource-group
```

## Troubleshooting

### Erro de redirect_uri_mismatch:
- Verifique se a URL de redirect no Azure AD está correta
- Certifique-se que não há barras extras no final da URL

### Erro 404 em rotas:
- Configure o arquivo `staticwebapp.config.json` corretamente
- Certifique-se que o fallback está configurado para SPA

### Problemas de CORS:
- Configure CORS no Azure AD se necessário
- Verifique as origens permitidas

### Performance:
- Use Azure CDN para assets estáticos
- Configure cache headers adequadamente
- Otimize imagens e recursos
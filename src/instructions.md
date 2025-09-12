# Configuração Azure AD - Ordeminds

## Próximos passos para configurar Azure AD:

### 1. Configurar no Azure Portal
1. Acesse o Azure Portal (portal.azure.com)
2. Vá para "Azure Active Directory"
3. Selecione "App registrations" -> "New registration"
4. Configure:
   - Name: "Ordeminds"
   - Supported account types: "Accounts in this organizational directory only"
   - Redirect URI: `http://localhost:8080` (para desenvolvimento)

### 2. Obter credenciais
Após criar o app registration, anote:
- **Application (client) ID** 
- **Directory (tenant) ID**

### 3. Configurar no código
Edite o arquivo `src/lib/msalConfig.ts`:
```typescript
export const msalConfig: Configuration = {
  auth: {
    clientId: "SEU_CLIENT_ID_AQUI", // Cole o Client ID aqui
    authority: "https://login.microsoftonline.com/SEU_TENANT_ID_AQUI", // Cole o Tenant ID aqui
    redirectUri: window.location.origin,
  },
  // ... resto da configuração
};
```

### 4. Configurar para produção
Para usar em produção, adicione a URL do seu domínio nas redirect URIs no Azure Portal.

## Funcionalidades implementadas:
- ✅ Login com Microsoft (popup)
- ✅ Logout
- ✅ Proteção de rotas
- ✅ Exibição de dados do usuário
- ✅ Redirecionamento automático
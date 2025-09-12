import { Configuration, PublicClientApplication } from '@azure/msal-browser';

// Configuração do MSAL para Azure AD
export const msalConfig: Configuration = {
  auth: {
    clientId: "SEU_CLIENT_ID_AQUI", // Substitua pelo seu Client ID do Azure AD
    authority: "https://login.microsoftonline.com/SEU_TENANT_ID_AQUI", // Substitua pelo seu Tenant ID
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: "sessionStorage", // Pode ser "localStorage" ou "sessionStorage"
    storeAuthStateInCookie: false, // Defina como true se houver problemas de IE/Edge
  },
};

// Criar instância do MSAL
export const msalInstance = new PublicClientApplication(msalConfig);

// Scopes de login
export const loginRequest = {
  scopes: ["User.Read"]
};
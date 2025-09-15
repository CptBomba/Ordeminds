

## Azure App Service (Web App) - Deploy
- Build no GitHub Actions e deploy apenas do `dist/`.
- Crie o secret **AZUREAPPSERVICE_PUBLISHPROFILE** com o Publish Profile (Portal Azure → Web App → Overview → Get publish profile).
- Defina **Startup Command**: `pm2 serve /home/site/wwwroot --spa --no-daemon`
- (Opcional) App Setting: `WEBSITE_NODE_DEFAULT_VERSION = ~20` e `SCM_DO_BUILD_DURING_DEPLOYMENT = false`.

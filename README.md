# Ordeminds — Site (Express + Static)

Como publicar na Azure App Service (sem GitHub):
1) Abra **Ferramentas avançadas (Kudu)** do seu Web App → Debug console (Bash).
2) Vá para `/home/site/wwwroot` e limpe arquivos antigos se houver.
3) Envie e extraia este ZIP na lista de arquivos do Kudu.
4) Rode `npm install --production` dentro de `/home/site/wwwroot`.
5) Reinicie o Web App e acesse a URL pública.

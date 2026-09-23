# Configuração do Firebase Cloud Firestore

Siga os passos abaixo para configurar o Firebase no seu projeto Drinks App.

## 1. Instalar Dependências

No terminal do projeto, instale o Firebase. O arquivo `package.json` já foi atualizado, então você pode apenas instalar as dependências:

```bash
npm install firebase
# ou apenas npm install
```

## 2. Variáveis de Ambiente (.env)

O arquivo `.env` na raiz do projeto deve conter **exatamente** as seguintes chaves. Preencha os valores de acordo com as configurações do seu projeto no painel do Firebase:

```env
VITE_FIREBASE_API_KEY=sua_api_key_aqui
VITE_FIREBASE_AUTH_DOMAIN=seu_auth_domain_aqui
VITE_FIREBASE_PROJECT_ID=seu_project_id_aqui
VITE_FIREBASE_STORAGE_BUCKET=seu_storage_bucket_aqui
VITE_FIREBASE_MESSAGING_SENDER_ID=seu_messaging_sender_id_aqui
VITE_FIREBASE_APP_ID=seu_app_id_aqui

# Integração de Imagens (ImgBB)
VITE_IMGBB_API_KEY=sua_api_key_imgbb_aqui
```

> **Aviso Importante**: É obrigatório garantir que a variável `VITE_IMGBB_API_KEY` seja preenchida com uma chave válida do ImgBB. O aplicativo depende dessa API para enviar as fotos sem ultrapassar os limites de armazenamento do Firestore.

## 3. Regras Básicas de Segurança (Firestore)

No painel do Firebase Console:
1. Acesse **Firestore Database**.
2. Vá para a aba **Regras** (Rules).
3. Substitua o conteúdo pelas regras de modo de teste abaixo, que permitem leitura e escrita públicas (ideal apenas para desenvolvimento ou demonstração, como solicitado):

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

## 4. Inicialização do App

Pronto! Ao iniciar o servidor de desenvolvimento (`npm run dev`), o aplicativo já estará conectado ao Firestore. A coleção `drinks` será criada automaticamente assim que o primeiro drink for cadastrado. As imagens dos drinks serão enviadas para a API do ImgBB usando a sua `VITE_IMGBB_API_KEY` configurada e apenas a URL será salva no Firestore.

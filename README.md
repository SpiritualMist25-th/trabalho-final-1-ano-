# 🎮 Game Post

Fórum online para a comunidade de jogos. Crie sua conta, faça login e publique posts com título, nome do jogo, descrição e imagem. Os posts ficam salvos na nuvem e aparecem para todos os visitantes.

## ✨ Funcionalidades

- **Contas de usuário:** cadastro e login com e-mail e senha (Firebase Authentication)
- **Fórum:** qualquer pessoa pode ler os posts; só quem está logado pode publicar (Cloud Firestore)
- **Posts com imagem:** upload de imagem de até 500 KB, com pré-visualização
- **Carrossel** de jogos em destaque na página de posts
- **Vídeo demonstrativo** e passo a passo na página inicial
- **Configurações:** modo escuro e tamanho do texto, salvos no navegador de cada pessoa
- Páginas: Início, Posts, Login, Criar conta, Sobre e Configurações

## 🛠️ Tecnologias

- HTML, CSS e JavaScript puro (sem frameworks)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Cloud Firestore](https://firebase.google.com/docs/firestore)
- `localStorage` para as preferências de tema e tamanho de texto

## 📁 Estrutura do projeto

```
.
├── index.html            # página inicial
├── estilo.css            # estilos e cores do site
├── video.mp4             # vídeo demonstrativo
├── imagem1.png ... 8.png # imagens do carrossel
├── html/
│   ├── post.html         # fórum (criar e ver posts)
│   ├── login.html
│   ├── criar_conta.html
│   ├── sobre.html
│   └── config.html
├── scripts/
│   └── index.js          # lógica do site + Firebase
└── firestore.rules       # regras de segurança do banco
```

## 🚀 Como rodar

O site usa `import()` de módulos, então **não funciona abrindo o `index.html` direto** no navegador (`file://`). Use um servidor local:

```bash
git clone https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git
cd SEU-REPOSITORIO
npx serve .
```

Depois abra o endereço que aparecer no terminal (normalmente `http://localhost:3000`).

Também funciona com a extensão **Live Server** do VS Code ou com `python3 -m http.server`.

## 🔥 Configurando seu próprio Firebase

O projeto já vem com uma configuração, mas para usar o seu próprio banco:

1. Crie um projeto em [console.firebase.google.com](https://console.firebase.google.com) e adicione um **app Web**.
2. Em **Authentication → Método de login**, ative **E-mail/senha**.
3. Em **Firestore Database**, crie o banco de dados.
4. Em **Firestore Database → Regras**, cole o conteúdo de `firestore.rules` e clique em **Publicar**.
5. Em **Authentication → Configurações → Domínios autorizados**, adicione o domínio onde o site vai ficar.
6. No arquivo `scripts/index.js`, troque o objeto `firebaseConfig` pelos dados do seu projeto.

> A `apiKey` do Firebase Web pode ficar pública no código. Quem protege os dados são as **regras do Firestore**, por isso nunca deixe de publicá-las.

## 🔒 Regras de segurança

Definidas em `firestore.rules`:

- Qualquer pessoa pode **ler** os posts
- Só usuários **logados** podem criar posts, e o post precisa ter exatamente os campos esperados, com limites de tamanho (título até 80 caracteres, descrição até 4000, imagem até 500 KB)
- Posts **não podem ser editados**
- Só o **autor** pode apagar o próprio post

## 👥 Autores

Feito por **Pyetro V.** e **Miguel S.**

# Prompt para colar no Claude Code (VS Code) — Firebase + GitHub da Elea

Abra a pasta `Elea Fornecia Oficial 2026` no VS Code e cole o texto abaixo no Claude Code.

---

Projeto: site da Elea Forneria nesta pasta (HTML/CSS/JS puro, padrão do projeto Cucina em `Desktop\Cucina`). Leia primeiro `docs/CONTINUAR_NO_CLAUDE_CODE.md`. Não mexa no Cucina nem no WordPress em `D:\xampp`.

Objetivo: versionar no GitHub e publicar um link de teste no Firebase Hosting, com login e pedidos funcionando de verdade.

1. **Git próprio do projeto.** A pasta do usuário (`C:\Users\Meneleu`) já é um repositório git; crie um repositório SÓ desta pasta (`git init -b main` aqui dentro), confira o `.gitignore` (img/, .env*, .firebase/, *.log ficam de fora) e faça o primeiro commit. Mostre `git status` antes do commit.
2. **GitHub.** Com o `gh`, crie o repositório PRIVADO `BAM-Assessoria/elea-forneria` (mesma organização do Cucina) e faça push da `main`. Me mostre o link.
3. **Firebase (plano gratuito Spark).** Rode `firebase login:list` e me diga qual conta está logada antes de criar qualquer coisa. Depois:
   - `firebase projects:create` com id `elea-forneria` (se estiver ocupado, sugira outro) e `firebase use --add` (alias `default`, gera `.firebaserc`).
   - Firestore em `southamerica-east1`: `firebase firestore:databases:create "(default)" --location=southamerica-east1`.
   - App web: `firebase apps:create WEB elea-site` e `firebase apps:sdkconfig WEB <appId>`; cole os valores em `site/assets/js/config.js` → `FIREBASE` (a apiKey web é pública; a segurança está no `firestore.rules`).
   - Authentication: me passe o link do console para eu ativar **E-mail/senha** e **Google** (a CLI não ativa provedores).
4. **Publicar:** `firebase deploy --only firestore:rules,hosting` (o predeploy monta as páginas). Mantenha `EM_TESTE = true` em `ferramentas/montar-paginas.mjs` (noindex) — o link é só de teste. Me passe o link `https://<id>.web.app`.
5. **Conta da equipe:** eu crio minha conta em `/conta`; você me diz meu uid (Console → Authentication) e me guia para criar o documento `admins/{uid}` no Firestore. No painel `/admin`, clique em "Importar produtos iniciais".
6. **Teste ponta a ponta no link:** encomenda com retirada ≥ 24h (deve passar), tentar retirada < 24h (as regras devem negar), mudar a situação no painel e ver em Minha conta.
7. Atualize `docs/CONTINUAR_NO_CLAUDE_CODE.md` (projeto Firebase, link, repositório), faça commit e push. Nunca commite senhas, tokens ou `.env`.

Pare e me pergunte antes de: criar recursos pagos (Blaze), mudar DNS/domínio ou apagar qualquer coisa.

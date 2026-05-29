# Bot Discord com IA

Bot Discord com personalidade própria e livre-arbítrio. Suporta **Ollama** (local) e **Groq** (nuvem, grátis).

## Backends de IA

| Backend | Quando usar | Como configurar |
|---|---|---|
| **Groq** (recomendado para nuvem) | Render, Railway, VPS | Definir `GROQ_API_KEY` |
| **Ollama** (local) | Rodar no próprio PC | Deixar `GROQ_API_KEY` vazio |

Se `GROQ_API_KEY` estiver definido, o bot usa Groq automaticamente. Senão, usa Ollama local.

---

## Deploy no Render (grátis, 24h online)

1. Faça o push para o GitHub
2. Acesse [render.com](https://render.com) e crie conta
3. **New → Background Worker**
4. Conecte seu repositório GitHub
5. Em **Environment Variables**, adicione:
   - `DISCORD_TOKEN` → token do seu bot
   - `GROQ_API_KEY` → chave do [console.groq.com](https://console.groq.com)
6. Clique em **Deploy**

> O `render.yaml` já está configurado — o Render detecta automaticamente.

---

## Rodar localmente (Ollama)

### Pré-requisitos

- [Node.js 18+](https://nodejs.org)
- [Ollama](https://ollama.com/download)

### Windows (automático)

```
setup.bat   ← instala tudo
start.bat   ← inicia o bot
```

### Manual

```bash
npm install
cp .env.example .env
# Edite .env: coloque DISCORD_TOKEN, deixe GROQ_API_KEY vazio

ollama pull llama3.2
ollama serve          # em outro terminal

npm start
```

---

## Configuração (.env)

| Variável | Descrição | Padrão |
|---|---|---|
| `DISCORD_TOKEN` | Token do bot Discord | **obrigatório** |
| `GROQ_API_KEY` | Chave do Groq (se vazio, usa Ollama) | — |
| `GROQ_MODEL` | Modelo Groq | `llama-3.3-70b-versatile` |
| `OLLAMA_MODEL` | Modelo Ollama | `llama3.2` |
| `OLLAMA_BASE_URL` | Endereço do Ollama | `http://localhost:11434/v1` |
| `BOT_NAME` | Nome do bot | `LocalIA` |
| `SPONTANEOUS_CHANCE` | % de chance de entrar em conversas sem ser chamado | `30` |
| `BOT_PERSONA` | Personalidade em texto livre | *(padrão interno)* |

## Como obter o token do Discord

1. [discord.com/developers/applications](https://discord.com/developers/applications) → New Application
2. **Bot** → Reset Token → copie
3. Ative **Message Content Intent** em Privileged Gateway Intents
4. **OAuth2 → URL Generator** → marque `bot` + permissões → copie a URL → adicione ao servidor

## Comportamento

- **Livre-arbítrio:** o bot decide sozinho se quer responder, mesmo quando mencionado
- **Memória persistente:** todas as mensagens ficam salvas em `memory.json`
- **Participação espontânea:** com `SPONTANEOUS_CHANCE`% de chance, avalia mensagens sem ser chamado

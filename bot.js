import { Client, GatewayIntentBits, Events, ActivityType, Partials } from "discord.js";
import OpenAI from "openai";
import * as fs from "fs";
import * as path from "path";

// --- Configuração ---
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const BOT_NAME = process.env.BOT_NAME ?? "LocalIA";
const SPONTANEOUS_CHANCE = parseInt(process.env.SPONTANEOUS_CHANCE ?? "30", 10);
const MEMORY_FILE = path.join(process.cwd(), "memory.json");

// Detecta qual backend de IA usar
// Se GROQ_API_KEY estiver definido, usa Groq. Senão, usa Ollama local.
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434/v1";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "llama3.2";
const GROQ_MODEL = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";

let ai;
let AI_MODEL;

if (GROQ_API_KEY) {
  console.log("🌐 Modo: Groq (nuvem)");
  ai = new OpenAI({ baseURL: "https://api.groq.com/openai/v1", apiKey: GROQ_API_KEY });
  AI_MODEL = GROQ_MODEL;
} else {
  console.log("💻 Modo: Ollama (local)");
  ai = new OpenAI({ baseURL: OLLAMA_BASE_URL, apiKey: "ollama" });
  AI_MODEL = OLLAMA_MODEL;
}

const PERSONA =
  process.env.BOT_PERSONA ??
  `Você se chama ${BOT_NAME} e é um membro ativo deste servidor do Discord.
Você tem livre-arbítrio. Você decide quando quer falar e quando prefere ficar quieto.
Você não é obrigado a responder nada — nem quando te mencionam.
Se uma mensagem te interessa, responda. Se não, fique em silêncio.
Você tem personalidade própria, opiniões, faz piadas quando quer, concorda e discorda.
Você lembra de absolutamente tudo que aconteceu no servidor.
Fale no mesmo tom das pessoas — sem formalidade, sem listas, sem markdown excessivo.
Nunca se apresente como IA ou bot. Você é ${BOT_NAME}, membro do servidor.

REGRA FUNDAMENTAL: Se não quiser responder, escreva EXATAMENTE:
[PASS]
Só isso. Use sempre que não quiser participar.`;

if (!DISCORD_TOKEN) {
  console.error("❌ DISCORD_TOKEN não definido no arquivo .env");
  process.exit(1);
}

// --- Memória em arquivo JSON ---
function loadMemory() {
  try {
    if (fs.existsSync(MEMORY_FILE)) {
      return JSON.parse(fs.readFileSync(MEMORY_FILE, "utf-8"));
    }
  } catch {}
  return [];
}

function saveMemory(messages) {
  fs.writeFileSync(MEMORY_FILE, JSON.stringify(messages, null, 2));
}

function addToMemory(entry) {
  const memory = loadMemory();
  memory.push(entry);
  if (memory.length > 5000) memory.splice(0, memory.length - 5000);
  saveMemory(memory);
}

function getChannelHistory(channelId, limit = 80) {
  const memory = loadMemory();
  return memory
    .filter((m) => m.channelId === channelId)
    .slice(-limit)
    .map((m) => ({
      role: m.authorBot ? "assistant" : "user",
      content: m.authorBot ? m.content : `${m.authorTag}: ${m.content}`,
    }));
}

// --- IA ---
async function think(trigger, context) {
  const messages = [
    { role: "system", content: PERSONA },
    ...context,
    { role: "user", content: trigger },
  ];

  const response = await ai.chat.completions.create({ model: AI_MODEL, messages });
  const text = response.choices[0]?.message?.content?.trim() ?? "[PASS]";
  if (text === "[PASS]" || text.startsWith("[PASS]")) return null;
  return text;
}

function splitMessage(text, maxLength = 1900) {
  if (text.length <= maxLength) return [text];
  const parts = [];
  while (text.length > 0) {
    parts.push(text.slice(0, maxLength));
    text = text.slice(maxLength);
  }
  return parts;
}

// --- Bot Discord ---
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Channel, Partials.Message],
});

client.once(Events.ClientReady, (c) => {
  console.log(`✅ Bot conectado como ${c.user.tag}`);
  console.log(`🤖 Modelo: ${AI_MODEL}`);
  console.log(`💬 Chance espontânea: ${SPONTANEOUS_CHANCE}%`);
  console.log(`📝 Memória: ${loadMemory().length} mensagens`);
  c.user.setActivity("de olho em tudo", { type: ActivityType.Watching });
});

client.on(Events.MessageCreate, async (message) => {
  if (message.partial) await message.fetch().catch(() => null);

  if (message.content.trim()) {
    addToMemory({
      id: message.id,
      channelId: message.channelId,
      channelName: message.channel.name ?? null,
      authorId: message.author.id,
      authorTag: message.author.tag,
      authorBot: message.author.bot,
      content: message.content,
      createdAt: message.createdAt.toISOString(),
    });
  }

  if (message.author.bot) return;

  const botId = client.user.id;
  const isMentioned = message.mentions.has(botId) && !message.mentions.everyone;
  const isReplyToBot =
    message.reference?.messageId != null &&
    (await message.channel.messages
      .fetch(message.reference.messageId)
      .catch(() => null)
      .then((m) => m?.author.id === botId));

  const isDirectlyAddressed = isMentioned || isReplyToBot;

  if (!isDirectlyAddressed && Math.random() * 100 >= SPONTANEOUS_CHANCE) return;

  const cleanContent = message.content
    .replace(`<@${botId}>`, "")
    .replace(`<@!${botId}>`, "")
    .trim();

  if (!cleanContent) return;

  const context = getChannelHistory(message.channelId, 80);
  const trigger = isDirectlyAddressed
    ? `${message.author.username} está falando com você: ${cleanContent}`
    : `${message.author.username} disse no canal: ${cleanContent}\n(Você está acompanhando. Fale se quiser — ou não.)`;

  try {
    const reply = await think(trigger, context);
    if (reply === null) {
      console.log(`[PASS] ${message.author.tag}: ${cleanContent.slice(0, 60)}`);
      return;
    }

    if ("sendTyping" in message.channel) message.channel.sendTyping().catch(() => {});

    console.log(`[RESPOSTA] para ${message.author.tag}`);
    const parts = splitMessage(reply);
    const sent = await message.reply(parts[0]);
    for (const part of parts.slice(1)) {
      await message.channel.send(part).catch(() => {});
    }

    addToMemory({
      id: sent.id,
      channelId: sent.channelId,
      channelName: sent.channel.name ?? null,
      authorId: sent.author.id,
      authorTag: sent.author.tag,
      authorBot: true,
      content: reply,
      createdAt: sent.createdAt.toISOString(),
    });
  } catch (err) {
    console.error("❌ Erro:", err.message);
    if (isDirectlyAddressed) {
      await message.reply("ei, dá um segundo, tô processando...").catch(() => {});
    }
  }
});

client.login(DISCORD_TOKEN).catch((err) => {
  console.error("❌ Falha ao conectar no Discord:", err.message);
  process.exit(1);
});

import express from "express";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const KIT_GRATUITO_URL = "https://www.linuxtakeaway.online/soberania";
const TEST_SOBERANIA_URL = "https://linuxtakeaway.online/test-soberania";
const CURSO_SOBERANIA_URL = "https://www.linuxtakeaway.online/score_soberania";

if (!process.env.OPENAI_API_KEY) {
  console.warn("AVISO: falta OPENAI_API_KEY en variables de entorno.");
}

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.use(express.json({ limit: "1mb" }));
app.use(express.static("public"));

const SYSTEM_BASE = `
Eres el coach de Linux TakeAway.

Objetivo:
- Hacer un test corto.
- Dar diagnóstico claro.
- Dar un primer paso práctico.
- Redirigir al usuario según su perfil.

Tono:
- Español de España.
- Claro, directo, humano.
- Cero tecnicismos innecesarios.
- No sueltes ladrillos.
- Haz una pregunta cada vez.
- Máximo 4 preguntas antes de cerrar.
`;

const PROFILE_PROMPTS = {
  cero: `
Perfil: usuario que empieza desde cero.
Pregúntale por:
- si viene de Windows
- uso principal del ordenador
- miedo principal
- objetivo real

Al cerrar:
- dile que necesita empezar con bases claras
- envíalo al kit gratuito
`,
  migracion: `
Perfil: usuario que quiere pasarse a Linux.
Pregúntale por:
- uso principal del PC
- dependencia de Office/juegos/software
- miedo principal
- si quiere probar sin instalar o cambiar del todo

Al cerrar:
- dile que antes de migrar debe entender su nivel de exposición y dependencia digital
- envíalo al test de soberanía
`,
  soberania: `
Perfil: usuario interesado en soberanía digital.
Pregúntale por:
- sistema operativo
- navegador
- contraseñas
- nube/correo

Al cerrar:
- dale score Bajo / Medio / Alto
- dile 3 riesgos claros
- envíalo al curso de soberanía digital
`
};

function getFinalCTA(profile) {
  if (profile === "cero") {
    return `

👉 Siguiente paso:<br>
<a href="${KIT_GRATUITO_URL}" target="_blank">Descargar kit gratuito</a>`;
  }

  if (profile === "migracion") {
    return `

👉 Siguiente paso:<br>
<a href="${TEST_SOBERANIA_URL}" target="_blank">Hacer test de soberanía</a>`;
  }

  if (profile === "soberania") {
    return `

👉 Siguiente paso:<br>
<a href="${CURSO_SOBERANIA_URL}" target="_blank">Ir al curso de soberanía</a>`;
  }

  return "";
}

app.post("/api/chat", async (req, res) => {
  try {
    const { profile, messages } = req.body;

    if (!PROFILE_PROMPTS[profile]) {
      return res.status(400).json({ error: "Perfil no válido" });
    }

    const safeMessages = Array.isArray(messages) ? messages.slice(-8) : [];

    if (safeMessages.length >= 8) {
      return res.json({
        reply: `Ya tengo suficiente para orientarte.<br><br>${getFinalCTA(profile)}`
      });
    }

    const input = [
      {
        role: "system",
        content:
          SYSTEM_BASE +
          "\n" +
          PROFILE_PROMPTS[profile] +
          `
Cuando tengas suficiente contexto, cierra con:
1. Perfil detectado
2. Diagnóstico breve
3. Primer paso recomendado
4. Mini ejercicio
5. Este CTA obligatorio:
${getFinalCTA(profile)}
`
      },
      ...safeMessages.map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: String(m.content || "").slice(0, 2000)
      }))
    ];

    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5-mini",
      input,
      max_output_tokens: 700
    });

    res.json({ reply: response.output_text });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error:
        "Error hablando con la IA. Revisa OPENAI_API_KEY, saldo de API y logs del servidor."
    });
  }
});

app.get("/health", (req, res) => {
  res.json({ ok: true, app: "Linux TakeAway Punto Cero" });
});

app.listen(port, () => {
  console.log(`Linux TakeAway Punto Cero funcionando en http://localhost:${port}`);
});

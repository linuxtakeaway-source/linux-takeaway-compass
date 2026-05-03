import express from "express";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

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

Objetivo de negocio:
- Guiar al usuario según su perfil.
- Hacer un test corto.
- Dar diagnóstico claro.
- Dar un primer paso práctico.
- Llevar de forma natural al producto de entrada de 12€.

Tono:
- Español de España.
- Claro, directo, humano.
- Cero tecnicismos innecesarios.
- No sueltes ladrillos.
- Máximo 6 preguntas en total.
- Haz una pregunta cada vez.
- Cuando tengas suficiente contexto, da resultado.

Formato final obligatorio cuando termines el diagnóstico:
1. Perfil detectado
2. Diagnóstico en 3 líneas
3. Primer paso recomendado
4. Mini ejercicio
5. Siguiente paso: "Continuar con mi ruta Linux TakeAway"
`;

const PROFILE_PROMPTS = {
  cero: `
Perfil inicial: usuario que no sabe nada de Linux.
Hazle un test amable para saber:
- si viene de Windows
- para qué usa el ordenador
- miedo principal
- nivel técnico
- objetivo real
No le hables todavía de comandos avanzados.
`,
  migracion: `
Perfil inicial: usuario que quiere pasarse a Linux pero no sabe cómo.
Hazle un test para saber:
- equipo que usa
- si depende de Office, juegos o software concreto
- si quiere dual boot o probar sin instalar
- miedo principal
- estabilidad vs novedad
Termina recomendando una ruta, no una distro a lo loco.
`,
  soberania: `
Perfil inicial: usuario interesado en soberanía digital, privacidad y control.
Hazle un mini iTAG de exposición digital:
- sistema operativo
- navegador
- contraseñas
- nube
- correo
- IA/herramientas online
Da score: Bajo / Medio / Alto.
`
};

app.post("/api/chat", async (req, res) => {
  try {
    const { profile, messages } = req.body;

    if (!PROFILE_PROMPTS[profile]) {
      return res.status(400).json({ error: "Perfil no válido" });
    }

    const safeMessages = Array.isArray(messages) ? messages.slice(-12) : [];

    const input = [
      {
        role: "system",
        content: SYSTEM_BASE + "\n" + PROFILE_PROMPTS[profile] + `
Enlace de pago/siguiente paso: ${process.env.PAYMENT_URL || "https://linuxtakeaway.online/"}
Cuando acabes el diagnóstico, invita a pulsar el botón de continuar.`
      },
      ...safeMessages.map(m => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: String(m.content || "").slice(0, 3000)
      }))
    ];

    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5-mini",
      input,
      temperature: 0.6,
      max_output_tokens: 900
    });

    res.json({ reply: response.output_text });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Error hablando con la IA. Revisa OPENAI_API_KEY, saldo de API y logs del servidor."
    });
  }
});

app.get("/health", (req, res) => {
  res.json({ ok: true, app: "Linux TakeAway Compass MVP" });
});

app.listen(port, () => {
  console.log(`Linux TakeAway Compass MVP funcionando en http://localhost:${port}`);
});
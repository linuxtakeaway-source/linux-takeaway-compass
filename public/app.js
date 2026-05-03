const profiles = {
  cero: {
    title: "Ruta Cero Linux",
    first: "Vamos a situarte. Primera pregunta: ¿usas ahora Windows, Mac o ya has tocado algo de Linux?"
  },
  migracion: {
    title: "Migración a Linux",
    first: "Perfecto. Primera pregunta: ¿para qué usas principalmente el ordenador: trabajo/ofimática, gaming, desarrollo o uso personal?"
  },
  soberania: {
    title: "Soberanía Digital",
    first: "Vamos a calcular tu exposición digital. Primera pregunta: ¿qué sistema operativo usas ahora en tu equipo principal?"
  }
};

let currentProfile = null;
let messages = [];

const profileButtons = document.querySelectorAll("[data-profile]");
const profilesSection = document.getElementById("profiles");
const chatWrap = document.getElementById("chatWrap");
const chatTitle = document.getElementById("chatTitle");
const messagesDiv = document.getElementById("messages");
const chatForm = document.getElementById("chatForm");
const messageInput = document.getElementById("messageInput");

function addMessage(role, content) {
  messages.push({ role, content });
  const div = document.createElement("div");
  div.className = `msg ${role}`;
  div.innerHTML = content; // 👈 CAMBIO CLAVE (antes era textContent)
  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

profileButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    currentProfile = btn.dataset.profile;
    messages = [];
    messagesDiv.innerHTML = "";
    chatTitle.textContent = profiles[currentProfile].title;
    profilesSection.classList.add("hidden");
    chatWrap.classList.remove("hidden");
    addMessage("assistant", profiles[currentProfile].first);
  });
});

chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = messageInput.value.trim();
  if (!text || !currentProfile) return;

  addMessage("user", text);
  messageInput.value = "";

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile: currentProfile, messages })
    });

    const data = await res.json();
    addMessage("assistant", data.reply);
  } catch (err) {
    addMessage("assistant", "Error de conexión.");
  }
});

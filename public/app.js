const profiles = {
  cero: {
    title: "Ruta Cero Linux",
    first: "Vamos a situarte. Primera pregunta: ¿usas ahora Windows, Mac o ya has tocado algo de Linux?"
  },
  migracion: {
    title: "Migración a Linux",
    first: "Perfecto. Primera pregunta: ¿para qué usas principalmente el ordenador: trabajo/ofimática, gaming, desarrollo, estudios o uso personal?"
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
const resetBtn = document.getElementById("resetBtn");
const payBtn = document.getElementById("payBtn");

function addMessage(role, content) {
  messages.push({ role, content });
  const div = document.createElement("div");
  div.className = `msg ${role}`;
  div.textContent = content;
  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;

  if (role === "assistant" && content.toLowerCase().includes("continuar con mi ruta")) {
    payBtn.classList.remove("hidden");
  }
}

profileButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    currentProfile = btn.dataset.profile;
    messages = [];
    messagesDiv.innerHTML = "";
    payBtn.classList.add("hidden");
    payBtn.href = "https://linuxtakeaway.online/";
    chatTitle.textContent = profiles[currentProfile].title;
    profilesSection.classList.add("hidden");
    chatWrap.classList.remove("hidden");
    addMessage("assistant", profiles[currentProfile].first);
    messageInput.focus();
  });
});

resetBtn.addEventListener("click", () => {
  currentProfile = null;
  messages = [];
  chatWrap.classList.add("hidden");
  profilesSection.classList.remove("hidden");
});

chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = messageInput.value.trim();
  if (!text || !currentProfile) return;

  addMessage("user", text);
  messageInput.value = "";
  messageInput.disabled = true;

  const loading = document.createElement("div");
  loading.className = "msg assistant";
  loading.textContent = "Pensando...";
  messagesDiv.appendChild(loading);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile: currentProfile, messages })
    });

    const data = await res.json();
    loading.remove();

    if (!res.ok) {
      addMessage("assistant", data.error || "Error al conectar con la IA.");
    } else {
      addMessage("assistant", data.reply);
    }
  } catch (err) {
    loading.remove();
    addMessage("assistant", "Error de conexión. Revisa que el servidor esté funcionando.");
  } finally {
    messageInput.disabled = false;
    messageInput.focus();
  }
});
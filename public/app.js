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
let typingEl = null;

const profileButtons = document.querySelectorAll("[data-profile]");
const profilesSection = document.getElementById("profiles");
const chatWrap = document.getElementById("chatWrap");
const chatTitle = document.getElementById("chatTitle");
const messagesDiv = document.getElementById("messages");
const chatForm = document.getElementById("chatForm");
const messageInput = document.getElementById("messageInput");
const resetBtn = document.getElementById("resetBtn");
const payBtn = document.getElementById("payBtn");

function escapeHTML(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function stripTags(value) {
  return String(value || "").replace(/<[^>]*>/g, "");
}

function makeLink(url, label) {
  return `<a class="chat-link" href="${escapeAttr(url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(label || url)}</a>`;
}

function renderContent(content) {
  let raw = String(content || "");

  const links = [];

  raw = raw.replace(/<a\s+href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi, (_, url, label) => {
    const token = `__LINK_${links.length}__`;
    links.push({
      url,
      label: stripTags(label)
    });
    return token;
  });

  raw = raw.replace(/<br\s*\/?>/gi, "\n");

  let html = escapeHTML(raw).replace(/\n/g, "<br>");

  html = html.replace(/https?:\/\/[^\s<]+/g, (url) => {
    const cleanUrl = url.replace(/[.,;!?)]$/, "");
    return makeLink(cleanUrl, cleanUrl);
  });

  links.forEach((link, index) => {
    html = html.replace(`__LINK_${index}__`, makeLink(link.url, link.label));
  });

  return html;
}

function scrollToBottom() {
  requestAnimationFrame(() => {
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  });
}

function addMessage(role, content) {
  messages.push({ role, content });

  const div = document.createElement("div");
  div.className = `msg ${role}`;
  div.innerHTML = renderContent(content);

  messagesDiv.appendChild(div);
  scrollToBottom();
}

function showTyping() {
  removeTyping();

  typingEl = document.createElement("div");
  typingEl.className = "msg assistant typing";
  typingEl.innerHTML = `
    <span>Pensando</span>
    <span class="dots">
      <span></span>
      <span></span>
      <span></span>
    </span>
  `;

  messagesDiv.appendChild(typingEl);
  scrollToBottom();
}

function removeTyping() {
  if (typingEl) {
    typingEl.remove();
    typingEl = null;
  }
}

function setLoading(isLoading) {
  const button = chatForm.querySelector("button");

  messageInput.disabled = isLoading;

  if (button) {
    button.disabled = isLoading;
    button.textContent = isLoading ? "Pensando..." : "Enviar";
  }
}

function startProfile(profile) {
  currentProfile = profile;
  messages = [];
  messagesDiv.innerHTML = "";

  if (payBtn) {
    payBtn.classList.add("hidden");
  }

  document.body.classList.add("chat-open");

  chatTitle.textContent = profiles[currentProfile].title;
  profilesSection.classList.add("hidden");
  chatWrap.classList.remove("hidden");

  addMessage("assistant", profiles[currentProfile].first);
  messageInput.focus();
}

profileButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    startProfile(btn.dataset.profile);
  });
});

if (resetBtn) {
  resetBtn.addEventListener("click", () => {
    currentProfile = null;
    messages = [];
    messagesDiv.innerHTML = "";
    document.body.classList.remove("chat-open");
    chatWrap.classList.add("hidden");
    profilesSection.classList.remove("hidden");
  });
}

chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const text = messageInput.value.trim();

  if (!text || !currentProfile) {
    return;
  }

  addMessage("user", text);
  messageInput.value = "";

  showTyping();
  setLoading(true);

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        profile: currentProfile,
        messages
      })
    });

    const data = await res.json();

    removeTyping();

    if (!res.ok) {
      addMessage("assistant", data.error || "Error al conectar con la IA.");
      return;
    }

    addMessage("assistant", data.reply || "No he recibido respuesta.");
  } catch (err) {
    removeTyping();
    addMessage("assistant", "Error de conexión. Prueba otra vez en unos segundos.");
  } finally {
    setLoading(false);
    messageInput.focus();
    scrollToBottom();
  }
});

(() => {
  const CHAT_KEY = "tc_chat_v1";
  const OPEN_KEY = "tc_chat_open_v1";

  function loadChat() {
    try { return JSON.parse(localStorage.getItem(CHAT_KEY) || "[]"); }
    catch { return []; }
  }
  function saveChat(list) {
    localStorage.setItem(CHAT_KEY, JSON.stringify(list.slice(-200)));
  }

  function buildChat() {
    const app = document.querySelector(".app");
    if (!app) return;

    if (document.querySelector(".tc-chat")) return;

    const box = document.createElement("div");
    box.className = "tc-chat";
    box.id = "tcChat";
    box.innerHTML = `
      <div class="tc-chat-handle" id="tcChatHandle">CHAT</div>
      <div class="tc-chat-panel">
        <div class="tc-chat-messages" id="tcChatMessages"></div>
        <div class="tc-chat-input">
          <input id="tcChatInput" type="text" placeholder="Mesaj..." autocomplete="off">
          <button id="tcChatSend">Gönder</button>
        </div>
      </div>
    `;
    app.appendChild(box);

    // restore open state
    const open = localStorage.getItem(OPEN_KEY) === "1";
    if (open) box.classList.add("open");

    const handle = document.getElementById("tcChatHandle");
    handle.addEventListener("click", () => toggleChat());

    document.getElementById("tcChatSend").addEventListener("click", sendMessage);
    document.getElementById("tcChatInput").addEventListener("keydown", (e) => {
      if (e.key === "Enter") sendMessage();
    });

    render();
  }

  function toggleChat(force) {
    const box = document.getElementById("tcChat");
    if (!box) return;
    const willOpen = (typeof force === "boolean") ? force : !box.classList.contains("open");
    box.classList.toggle("open", willOpen);
    localStorage.setItem(OPEN_KEY, willOpen ? "1" : "0");
  }

  function render() {
    const area = document.getElementById("tcChatMessages");
    if (!area) return;
    const list = loadChat();
    area.innerHTML = "";
    for (const m of list) {
      const div = document.createElement("div");
      div.textContent = `${m.u}: ${m.t}`;
      area.appendChild(div);
    }
    area.scrollTop = area.scrollHeight;
  }

  function sendMessage() {
    const input = document.getElementById("tcChatInput");
    if (!input) return;
    const txt = input.value.trim();
    if (!txt) return;

    const p = window.player || { username: "Player01" };
    const list = loadChat();
    list.push({ u: p.username, t: txt, ts: Date.now() });
    saveChat(list);
    input.value = "";
    render();
    toggleChat(true); // gönderince açık kalsın
  }

  // expose if needed
  window.tcChat = { toggleChat };

  document.addEventListener("DOMContentLoaded", buildChat);
})();

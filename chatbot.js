// Chatbot da Barbearia Xavier Junior
// Responde dúvidas comuns e faz o agendamento pelo WhatsApp.
(function () {
  const WHATSAPP = "558581573745";
  const INSTAGRAM =
    "https://www.instagram.com/barbeariaxavierjunior?igsh=M3o4cHg5MDVraHNp";
  const ENDERECO =
    "R. Sete de Setembro, 448 - CS A - Capuan, Caucaia - CE, 61600-010";
  const MAPS =
    "https://www.google.com/maps?q=R.+Sete+de+Setembro,+448+-+Capuan,+Caucaia+-+CE";

  const SERVICOS = [
    { nome: "Corte Social", preco: 30 },
    { nome: "Barba", preco: 20 },
    { nome: "Corte + Barba", preco: 50 },
    { nome: "Sobrancelha", preco: 10 },
    { nome: "Combo Premium", preco: 60 },
  ];

  const MENU = ["💈 Serviços e preços", "🕒 Horários", "📍 Endereço", "📅 Agendar", "💬 Falar no WhatsApp"];

  // ─── Monta o widget ───
  const root = document.createElement("div");
  root.className = "bxj-chat";
  root.innerHTML = `
    <button class="bxj-chat-toggle" aria-label="Abrir chat">
      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H8l-4 4V6a2 2 0 0 1 2-2z"/></svg>
    </button>
    <div class="bxj-chat-window" role="dialog" aria-label="Chat da Barbearia" hidden>
      <div class="bxj-chat-header">
        <img src="images/Logo-BXJ.png" alt="" />
        <div>
          <strong>Assistente BXJ</strong>
          <span>Respondemos na hora</span>
        </div>
        <button class="bxj-chat-close" aria-label="Fechar chat">✕</button>
      </div>
      <div class="bxj-chat-body"></div>
      <div class="bxj-chat-options"></div>
      <form class="bxj-chat-input">
        <input type="text" placeholder="Digite sua mensagem..." autocomplete="off" />
        <button type="submit" aria-label="Enviar">➤</button>
      </form>
    </div>`;
  document.body.appendChild(root);

  const toggle = root.querySelector(".bxj-chat-toggle");
  const win = root.querySelector(".bxj-chat-window");
  const body = root.querySelector(".bxj-chat-body");
  const options = root.querySelector(".bxj-chat-options");
  const form = root.querySelector(".bxj-chat-input");
  const input = form.querySelector("input");

  // Estado do agendamento em andamento (null = conversa livre)
  let booking = null;
  let started = false;

  function open() {
    win.hidden = false;
    root.classList.add("open");
    if (!started) {
      started = true;
      bot("Olá! 👋 Sou o assistente da <b>Barbearia Xavier Junior</b>. Como posso te ajudar?");
      showOptions(MENU);
    }
    setTimeout(() => input.focus(), 100);
  }

  function close() {
    win.hidden = true;
    root.classList.remove("open");
  }

  toggle.addEventListener("click", () => (win.hidden ? open() : close()));
  root.querySelector(".bxj-chat-close").addEventListener("click", close);

  function addMsg(html, who) {
    const el = document.createElement("div");
    el.className = "bxj-msg bxj-" + who;
    el.innerHTML = html;
    body.appendChild(el);
    body.scrollTop = body.scrollHeight;
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  }

  function bot(html) {
    addMsg(html, "bot");
  }

  function showOptions(list) {
    options.innerHTML = "";
    list.forEach((label) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = label;
      b.addEventListener("click", () => handle(label));
      options.appendChild(b);
    });
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    handle(text);
  });

  function handle(text) {
    addMsg(escapeHtml(text), "user");
    options.innerHTML = "";
    // Pequeno atraso para parecer uma conversa
    setTimeout(() => (booking ? bookingStep(text) : reply(text)), 350);
  }

  // Remove acentos e deixa minúsculo para comparar palavras
  function norm(s) {
    return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  }

  function has(text, words) {
    const t = norm(text);
    return words.some((w) => t.includes(w));
  }

  // ─── Respostas da conversa livre ───
  function reply(text) {
    if (has(text, ["agend", "marcar", "reserv", "horario disponivel", "vaga"])) {
      return startBooking();
    }
    if (has(text, ["servico", "preco", "valor", "quanto", "custa", "corte", "barba", "sobrancelha", "combo", "tabela"])) {
      const lista = SERVICOS.map((s) => `• ${s.nome} — <b>R$${s.preco}</b>`).join("<br>");
      bot(`Nossos serviços:<br>${lista}`);
      bot("Quer agendar algum deles?");
      return showOptions(["📅 Agendar", "⬅️ Menu"]);
    }
    if (has(text, ["horario", "hora", "abre", "fecha", "funciona", "domingo", "sabado", "aberto"])) {
      bot("🕒 Nossos horários:<br>• <b>Seg a Sex:</b> 09h às 19h<br>• <b>Sábado:</b> 09h às 18h<br>• <b>Domingo:</b> sob consulta");
      return showOptions(["📅 Agendar", "⬅️ Menu"]);
    }
    if (has(text, ["endereco", "onde", "local", "fica", "chegar", "mapa", "rua"])) {
      bot(`📍 ${ENDERECO}<br><a href="${MAPS}" target="_blank" rel="noopener">Abrir no Google Maps</a>`);
      return showOptions(["📅 Agendar", "⬅️ Menu"]);
    }
    if (has(text, ["whats", "zap", "telefone", "contato", "ligar", "falar", "atendente", "humano"])) {
      bot(`Clique para falar com a gente: <a href="https://wa.me/${WHATSAPP}" target="_blank" rel="noopener">abrir WhatsApp</a>`);
      return showOptions(["⬅️ Menu"]);
    }
    if (has(text, ["insta", "foto", "trabalho", "galeria"])) {
      bot(`Veja nossos trabalhos no <a href="${INSTAGRAM}" target="_blank" rel="noopener">Instagram @barbeariaxavierjunior</a> 📸`);
      return showOptions(["⬅️ Menu"]);
    }
    if (has(text, ["pagamento", "pix", "cartao", "dinheiro", "pagar"])) {
      bot("Sobre formas de pagamento, fale direto com a gente pelo WhatsApp que confirmamos pra você. 😉");
      return showOptions(["💬 Falar no WhatsApp", "⬅️ Menu"]);
    }
    if (has(text, ["obrigad", "valeu", "vlw", "tchau"])) {
      bot("Nós que agradecemos! Até a próxima. ✂️");
      return showOptions(MENU);
    }
    if (has(text, ["oi", "ola", "bom dia", "boa tarde", "boa noite", "menu", "inicio", "e ai"])) {
      bot("Como posso te ajudar?");
      return showOptions(MENU);
    }
    bot("Hmm, não entendi muito bem. 🤔 Escolha uma das opções abaixo ou fale com a gente no WhatsApp:");
    showOptions(MENU);
  }

  // ─── Fluxo de agendamento ───
  function startBooking() {
    booking = { step: "nome" };
    bot("Bora agendar! ✂️ Qual é o seu <b>nome</b>?");
    showOptions(["❌ Cancelar"]);
  }

  function cancelBooking() {
    booking = null;
    bot("Agendamento cancelado. Posso ajudar em mais alguma coisa?");
    showOptions(MENU);
  }

  function bookingStep(text) {
    if (has(text, ["cancelar"])) return cancelBooking();

    if (booking.step === "nome") {
      booking.nome = text;
      booking.step = "servico";
      bot(`Prazer, ${escapeHtml(text)}! Qual <b>serviço</b> você quer?`);
      return showOptions([...SERVICOS.map((s) => `${s.nome} (R$${s.preco})`), "❌ Cancelar"]);
    }

    if (booking.step === "servico") {
      const t = norm(text);
      // Procura do nome mais longo para o mais curto ("Corte + Barba" antes de "Barba")
      const found = [...SERVICOS]
        .sort((a, b) => b.nome.length - a.nome.length)
        .find((s) => t.includes(norm(s.nome)));
      if (!found) {
        bot("Escolha um dos serviços abaixo, por favor:");
        return showOptions([...SERVICOS.map((s) => `${s.nome} (R$${s.preco})`), "❌ Cancelar"]);
      }
      booking.servico = found.nome;
      booking.step = "data";
      bot("Para qual <b>dia</b>?");
      return showOptions([...nextDays(), "❌ Cancelar"]);
    }

    if (booking.step === "data") {
      const d = parseDate(text);
      if (!d) {
        bot("Não entendi a data. Escolha uma opção ou digite no formato <b>dd/mm</b>:");
        return showOptions([...nextDays(), "❌ Cancelar"]);
      }
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (d < today) {
        bot("Essa data já passou. 😅 Escolha outro dia:");
        return showOptions([...nextDays(), "❌ Cancelar"]);
      }
      booking.data = d;
      booking.step = "horario";
      if (d.getDay() === 0) {
        bot("Domingo é <b>sob consulta</b> — vamos confirmar pelo WhatsApp. Qual <b>horário</b> você prefere?");
      } else {
        bot("Qual <b>horário</b>? Escolha ou digite (ex: 14:30).");
      }
      return showOptions([...slotsFor(d), "❌ Cancelar"]);
    }

    if (booking.step === "horario") {
      const m = norm(text).match(/(\d{1,2})(?:[:h](\d{2}))?/);
      if (!m) {
        bot("Não entendi o horário. Digite algo como <b>14:30</b>:");
        return showOptions([...slotsFor(booking.data), "❌ Cancelar"]);
      }
      const h = Number(m[1]);
      const min = Number(m[2] || 0);
      const fecha = booking.data.getDay() === 6 ? 18 : 19;
      if (booking.data.getDay() !== 0 && (h < 9 || h >= fecha || min > 59)) {
        bot(`Nesse dia atendemos das 09h às ${fecha}h. Escolha outro horário:`);
        return showOptions([...slotsFor(booking.data), "❌ Cancelar"]);
      }
      booking.horario = `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
      return finishBooking();
    }
  }

  function finishBooking() {
    const dataFmt = booking.data.toLocaleDateString("pt-BR");
    const msg = `Olá, sou ${booking.nome}, gostaria de marcar: ${booking.servico}, em ${dataFmt} às ${booking.horario}h.`;
    const url = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`;
    bot(
      `Perfeito! Resumo do seu agendamento:<br>` +
        `• <b>Nome:</b> ${escapeHtml(booking.nome)}<br>` +
        `• <b>Serviço:</b> ${booking.servico}<br>` +
        `• <b>Data:</b> ${dataFmt}<br>` +
        `• <b>Horário:</b> ${booking.horario}`
    );
    bot(`<a class="bxj-wa-btn" href="${url}" target="_blank" rel="noopener">Confirmar no WhatsApp</a>`);
    booking = null;
    showOptions(["⬅️ Menu"]);
  }

  const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  // Próximos 5 dias como botões, ex: "Hoje (30/10)", "Sáb 01/11"
  function nextDays() {
    const out = [];
    const d = new Date();
    for (let i = 0; i < 5; i++) {
      const dm = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
      out.push(i === 0 ? `Hoje (${dm})` : i === 1 ? `Amanhã (${dm})` : `${DIAS[d.getDay()]} ${dm}`);
      d.setDate(d.getDate() + 1);
    }
    return out;
  }

  function parseDate(text) {
    const t = norm(text);
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    const m = t.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/);
    if (m) {
      let year = m[3] ? Number(m[3]) : d.getFullYear();
      if (year < 100) year += 2000;
      const result = new Date(year, Number(m[2]) - 1, Number(m[1]));
      // Sem ano e a data já passou? Considera o ano que vem.
      if (!m[3] && result < d) result.setFullYear(year + 1);
      return isNaN(result) ? null : result;
    }
    if (t.includes("hoje")) return d;
    if (t.includes("amanha")) {
      d.setDate(d.getDate() + 1);
      return d;
    }
    return null;
  }

  // Sugestões de horário. Para hoje, só mostra horários que ainda não passaram.
  function slotsFor(date) {
    const fecha = date.getDay() === 6 ? 18 : 19;
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const out = [];
    for (let h = 9; h < fecha; h += 2) {
      if (!isToday || h > now.getHours()) out.push(`${String(h).padStart(2, "0")}:00`);
    }
    return out;
  }
})();

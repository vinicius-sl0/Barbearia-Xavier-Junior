// Google Apps Script: recebe os agendamentos do chatbot do site
// e marca na Google Agenda do dono da conta.
// Como instalar: cole este código em script.google.com, implante como "App da Web"
// (executar como: eu / acesso: qualquer pessoa) e coloque o link em AGENDA_URL no chatbot.js.

const CONFIG = {
  DURACAO_MIN: 35,
  FUSO: "America/Fortaleza",
  SERVICOS: ["Corte Social", "Barba", "Corte + Barba", "Sobrancelha", "Combo Premium"],
  ABRE: 9, // hora de abertura
  // Hora de fechamento por dia da semana (0 = domingo ... 6 = sábado)
  FECHA: [19, 19, 19, 19, 19, 19, 18],
  INTERVALO_SUGESTOES_MIN: 30, // de quanto em quanto tempo sugerir horários livres
  MAX_SUGESTOES: 6,
};

// Abrir o link no navegador mostra isto: serve para testar se está no ar.
function doGet() {
  return json({ ok: true, msg: "Agenda da Barbearia funcionando" });
}

function doPost(e) {
  // Trava para dois clientes não pegarem o mesmo horário ao mesmo tempo
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    return json(agendar(JSON.parse(e.postData.contents)));
  } catch (err) {
    console.error(err);
    return json({ ok: false, erro: "Erro interno" });
  } finally {
    lock.releaseLock();
  }
}

function agendar(d) {
  const nome = String(d.nome || "").trim().slice(0, 60);
  const servico = String(d.servico || "");
  const data = String(d.data || "");
  const hora = String(d.hora || "");

  if (!nome) return invalido("Faltou o nome.");
  if (CONFIG.SERVICOS.indexOf(servico) === -1) return invalido("Serviço inválido.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data) || !/^\d{2}:\d{2}$/.test(hora)) {
    return invalido("Data ou horário inválido.");
  }

  const inicio = Utilities.parseDate(data + " " + hora, CONFIG.FUSO, "yyyy-MM-dd HH:mm");
  const fim = new Date(inicio.getTime() + CONFIG.DURACAO_MIN * 60000);
  const dia = Number(Utilities.formatDate(inicio, CONFIG.FUSO, "u")) % 7; // 0 = domingo
  const [h, m] = hora.split(":").map(Number);
  const fecha = CONFIG.FECHA[dia];

  if (inicio <= new Date()) return invalido("Esse horário já passou.");
  if (m > 59 || h < CONFIG.ABRE || h * 60 + m >= fecha * 60) {
    return invalido("Nesse dia atendemos das " + CONFIG.ABRE + "h às " + fecha + "h.");
  }

  const cal = CalendarApp.getDefaultCalendar();
  const eventosDoDia = eventosEntre(cal, inicioDoDia(data), fimDoDia(data));

  if (ocupado(eventosDoDia, inicio, fim)) {
    return { ok: false, ocupado: true, livres: horariosLivres(data, dia, eventosDoDia) };
  }

  const titulo = servico + " – " + nome + (dia === 0 ? " (domingo, confirmar)" : "");
  cal.createEvent(titulo, inicio, fim, {
    description: "Cliente: " + nome + "\nServiço: " + servico + "\nAgendado pelo chatbot do site.",
  });
  return { ok: true };
}

function eventosEntre(cal, de, ate) {
  return cal.getEvents(de, ate).map(function (ev) {
    return { inicio: ev.getStartTime(), fim: ev.getEndTime() };
  });
}

// Um horário está ocupado se algum evento se sobrepõe a ele.
// Eventos de dia inteiro (ex.: "Folga") também bloqueiam o dia.
function ocupado(eventos, inicio, fim) {
  return eventos.some(function (ev) {
    return ev.inicio < fim && ev.fim > inicio;
  });
}

function horariosLivres(data, dia, eventos) {
  const livres = [];
  const agora = new Date();
  const passo = CONFIG.INTERVALO_SUGESTOES_MIN;
  for (let min = CONFIG.ABRE * 60; min < CONFIG.FECHA[dia] * 60; min += passo) {
    const hhmm = pad(Math.floor(min / 60)) + ":" + pad(min % 60);
    const ini = Utilities.parseDate(data + " " + hhmm, CONFIG.FUSO, "yyyy-MM-dd HH:mm");
    const fim = new Date(ini.getTime() + CONFIG.DURACAO_MIN * 60000);
    if (ini > agora && !ocupado(eventos, ini, fim)) livres.push(hhmm);
    if (livres.length >= CONFIG.MAX_SUGESTOES) break;
  }
  return livres;
}

function inicioDoDia(data) {
  return Utilities.parseDate(data + " 00:00", CONFIG.FUSO, "yyyy-MM-dd HH:mm");
}

function fimDoDia(data) {
  return new Date(inicioDoDia(data).getTime() + 24 * 3600000);
}

function invalido(msg) {
  return { ok: false, invalido: true, erro: msg };
}

function pad(n) {
  return String(n).padStart(2, "0");
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

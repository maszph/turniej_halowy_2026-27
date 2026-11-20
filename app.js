// ============================================================
//  TURNIEJ HALOWY – wspólna logika
// ============================================================

let DATA = {
  druzyny: [],
  zawodnicy: [],
  mecze: [],
  bramki: []
};

// ---------- API ----------
async function fetchData() {
  if (!API_URL || API_URL.includes("WKLJ_TUTAJ")) {
    console.warn("Brak API_URL – używam danych mock");
    return loadMockData();
  }

  try {
    const res = await fetch(`${API_URL}?action=all&t=${Date.now()}`);
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || "Błąd API");
    DATA = {
      druzyny: json.druzyny || [],
      zawodnicy: json.zawodnicy || [],
      mecze: json.mecze || [],
      bramki: json.bramki || []
    };
    return true;
  } catch (err) {
    console.error(err);
    showToast("Błąd pobierania danych: " + err.message, "error");
    return false;
  }
}

async function apiPost(payload) {
  if (!API_URL || API_URL.includes("WKLJ_TUTAJ")) {
    showToast("Brak skonfigurowanego API_URL", "error");
    return { ok: false, error: "Brak API_URL" };
  }

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    return json;
  } catch (err) {
    console.error(err);
    return { ok: false, error: err.message };
  }
}

// ---------- OBLICZENIA ----------
function getTeamName(id) {
  const t = DATA.druzyny.find(d => d.id === id);
  return t ? t.nazwa : "???";
}

function getPlayerName(id) {
  const p = DATA.zawodnicy.find(z => z.id === id);
  return p ? p.imie : "???";
}

function calcTable() {
  const stats = {};

  DATA.druzyny.filter(d => d.aktywna !== false).forEach(d => {
    stats[d.id] = {
      id: d.id,
      nazwa: d.nazwa,
      m: 0, w: 0, r: 0, p: 0,
      bz: 0, bs: 0, // bramki zdobyte / stracone
      pkt: 0
    };
  });

  DATA.mecze.forEach(m => {
    const a = stats[m.druzyna_a];
    const b = stats[m.druzyna_b];
    if (!a || !b) return;

    a.m++; b.m++;
    a.bz += m.gole_a; a.bs += m.gole_b;
    b.bz += m.gole_b; b.bs += m.gole_a;

    if (m.gole_a > m.gole_b) {
      a.w++; a.pkt += 3;
      b.p++;
    } else if (m.gole_a < m.gole_b) {
      b.w++; b.pkt += 3;
      a.p++;
    } else {
      a.r++; b.r++;
      a.pkt += 1; b.pkt += 1;
    }
  });

  return Object.values(stats).sort((x, y) => {
    if (y.pkt !== x.pkt) return y.pkt - x.pkt;
    const diffX = x.bz - x.bs;
    const diffY = y.bz - y.bs;
    if (diffY !== diffX) return diffY - diffX;
    if (y.bz !== x.bz) return y.bz - x.bz;
    return x.nazwa.localeCompare(y.nazwa, "pl");
  });
}

function calcTopScorers() {
  // Używamy aktualnych bramek z zawodników (zaktualizowanych po każdym meczu)
  return DATA.zawodnicy
    .filter(z => z.bramki > 0)
    .map(z => ({
      id: z.id,
      imie: z.imie,
      bramki: z.bramki,
      team: getTeamName(z.id_druzyny)
    }))
    .sort((a, b) => b.bramki - a.bramki);
}

function getPlayersByTeam(teamId) {
  return DATA.zawodnicy
    .filter(z => z.id_druzyny === teamId)
    .sort((a, b) => b.bramki - a.bramki || a.imie.localeCompare(b.imie, "pl"));
}

// ---------- UI HELPERS ----------
function showToast(msg, type = "success") {
  let el = document.getElementById("toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "toast";
    el.className = "toast";
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.className = `toast ${type} show`;
  clearTimeout(el._timer);
  el._timer = setTimeout(() => el.classList.remove("show"), 3200);
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${day}.${month}.${d.getFullYear()}`;
}

// ---------- MOCK (gdy brak API) ----------
function loadMockData() {
  DATA = {
    druzyny: [
      { id: 1, nazwa: "LARPY FC", aktywna: true },
      { id: 2, nazwa: "FC BARYŁY", aktywna: true },
      { id: 3, nazwa: "PŁOMIEŃ BOBREK", aktywna: true },
      { id: 4, nazwa: "WOLF UNITED", aktywna: true }
    ],
    zawodnicy: [
      { id: 1, imie: "Filip Hojka", id_druzyny: 1, bramki: 0 },
      { id: 2, imie: "Franek Lubosik", id_druzyny: 1, bramki: 0 },
      { id: 3, imie: "Ksawery Jarzębak", id_druzyny: 1, bramki: 0 },
      { id: 4, imie: "Kacper Gajowski", id_druzyny: 1, bramki: 0 },
      { id: 5, imie: "Mateusz Szydłowski", id_druzyny: 2, bramki: 0 },
      { id: 6, imie: "Szymon Machtycz", id_druzyny: 2, bramki: 0 },
      { id: 7, imie: "Tycjan Karch", id_druzyny: 2, bramki: 0 },
      { id: 8, imie: "Kuba Tomyss", id_druzyny: 2, bramki: 0 },
      { id: 9, imie: "Kuba Białas", id_druzyny: 3, bramki: 0 },
      { id: 10, imie: "Piotr Gajowski", id_druzyny: 3, bramki: 0 },
      { id: 11, imie: "Mateusz Czyszoń", id_druzyny: 3, bramki: 0 },
      { id: 12, imie: "Piotr Szastok", id_druzyny: 3, bramki: 0 },
      { id: 13, imie: "Rosti Klymenko", id_druzyny: 4, bramki: 0 },
      { id: 14, imie: "Patryk Twardoch", id_druzyny: 4, bramki: 0 },
      { id: 15, imie: "Filip Horzela", id_druzyny: 4, bramki: 0 },
      { id: 16, imie: "Nikodem Młokosiewicz", id_druzyny: 4, bramki: 0 }
    ],
    mecze: [],
    bramki: []
  };
  return true;
}

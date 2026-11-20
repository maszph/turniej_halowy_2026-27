/**
 * ============================================================
 *  TURNIEJ HALOWY - DKS CZARNI KOZŁOWA GÓRA
 *  Google Apps Script (wklej do arkusza: Rozszerzenia → Apps Script)
 * ============================================================
 *
 * INSTRUKCJA:
 * 1. Utwórz nowy Google Sheet
 * 2. Nazwij arkusze dokładnie: Druzyny, Zawodnicy, Mecze, Bramki
 * 3. Wklej ten kod do Apps Script
 * 4. Zapisz → Deploy → New deployment → Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Skopiuj URL i wklej go do pliku config.js (API_URL)
 */

const ADMIN_PASSWORD = "Pawel987!";
const SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();

// ========== POMOCNICZE ==========
function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheet(name) {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
}

function sheetToObjects(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0].map(h => String(h).trim().toLowerCase());
  return data.slice(1).filter(row => row[0] !== "").map(row => {
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = row[i];
    });
    return obj;
  });
}

function nextId(sheet) {
  const last = sheet.getLastRow();
  if (last < 2) return 1;
  const ids = sheet.getRange(2, 1, last - 1, 1).getValues().flat().map(Number);
  return Math.max(...ids, 0) + 1;
}

// ========== DOGET – pobieranie danych ==========
function doGet(e) {
  try {
    const action = (e.parameter.action || "all").toLowerCase();

    if (action === "all" || action === "data") {
      const druzyny = sheetToObjects(getSheet("Druzyny"));
      const zawodnicy = sheetToObjects(getSheet("Zawodnicy"));
      const mecze = sheetToObjects(getSheet("Mecze"));
      const bramki = sheetToObjects(getSheet("Bramki"));

      return jsonResponse({
        ok: true,
        druzyny: druzyny.map(d => ({
          id: Number(d.id),
          nazwa: d.nazwa,
          aktywna: String(d.aktywna).toUpperCase() === "TRUE" || d.aktywna === true
        })),
        zawodnicy: zawodnicy.map(z => ({
          id: Number(z.id),
          imie: z.imie,
          id_druzyny: Number(z.id_druzyny),
          bramki: Number(z.bramki) || 0
        })),
        mecze: mecze.map(m => ({
          id: Number(m.id),
          data: m.data,
          druzyna_a: Number(m.druzyna_a),
          druzyna_b: Number(m.druzyna_b),
          gole_a: Number(m.gole_a),
          gole_b: Number(m.gole_b),
          utworzono: m.utworzono
        })),
        bramki: bramki.map(b => ({
          id: Number(b.id),
          id_meczu: Number(b.id_meczu),
          id_zawodnika: Number(b.id_zawodnika),
          liczba: Number(b.liczba) || 1
        }))
      });
    }

    return jsonResponse({ ok: false, error: "Nieznana akcja" });
  } catch (err) {
    return jsonResponse({ ok: false, error: err.message });
  }
}

// ========== DOPOST – zapis ==========
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = (data.action || "").toLowerCase();
    const password = data.password || "";

    // Sprawdzenie hasła (oprócz ewentualnych publicznych akcji – tu wszystkie wymagają)
    if (password !== ADMIN_PASSWORD) {
      return jsonResponse({ ok: false, error: "Błędne hasło" });
    }

    if (action === "addmatch") {
      return addMatch(data);
    }
    if (action === "addteam") {
      return addTeam(data);
    }
    if (action === "deletematch") {
      return deleteMatch(data);
    }

    return jsonResponse({ ok: false, error: "Nieznana akcja: " + action });
  } catch (err) {
    return jsonResponse({ ok: false, error: err.message });
  }
}

// ========== DODAWANIE MECZU ==========
function addMatch(data) {
  const meczeSheet = getSheet("Mecze");
  const bramkiSheet = getSheet("Bramki");
  const zawodnicySheet = getSheet("Zawodnicy");

  const id = nextId(meczeSheet);
  const now = Utilities.formatDate(new Date(), "Europe/Warsaw", "yyyy-MM-dd HH:mm:ss");

  // Dodaj mecz
  meczeSheet.appendRow([
    id,
    data.data || Utilities.formatDate(new Date(), "Europe/Warsaw", "yyyy-MM-dd"),
    Number(data.druzyna_a),
    Number(data.druzyna_b),
    Number(data.gole_a),
    Number(data.gole_b),
    now
  ]);

  // Dodaj bramki i zaktualizuj statystyki zawodników
  const scorers = data.strzelcy || []; // [{id_zawodnika, liczba}, ...]
  scorers.forEach(s => {
    if (!s.id_zawodnika || !s.liczba || s.liczba < 1) return;
    const bid = nextId(bramkiSheet);
    bramkiSheet.appendRow([bid, id, Number(s.id_zawodnika), Number(s.liczba)]);

    // Zwiększ bramki zawodnika
    const zawodnicy = sheetToObjects(zawodnicySheet);
    const player = zawodnicy.find(z => Number(z.id) === Number(s.id_zawodnika));
    if (player) {
      const rowIndex = zawodnicySheet.getDataRange().getValues().findIndex(r => Number(r[0]) === Number(s.id_zawodnika));
      if (rowIndex >= 1) {
        const current = Number(zawodnicySheet.getRange(rowIndex + 1, 4).getValue()) || 0;
        zawodnicySheet.getRange(rowIndex + 1, 4).setValue(current + Number(s.liczba));
      }
    }
  });

  return jsonResponse({ ok: true, id: id, message: "Mecz dodany" });
}

// ========== DODAWANIE DRUŻYNY ==========
function addTeam(data) {
  const nazwa = (data.nazwa || "").trim();
  const gracze = data.gracze || []; // tablica stringów

  if (!nazwa) return jsonResponse({ ok: false, error: "Brak nazwy drużyny" });
  if (gracze.length < 4) return jsonResponse({ ok: false, error: "Minimum 4 zawodników" });

  const druzynySheet = getSheet("Druzyny");
  const zawodnicySheet = getSheet("Zawodnicy");

  const teamId = nextId(druzynySheet);
  druzynySheet.appendRow([teamId, nazwa, "TRUE"]);

  gracze.forEach(imie => {
    const clean = String(imie).trim();
    if (!clean) return;
    const pid = nextId(zawodnicySheet);
    zawodnicySheet.appendRow([pid, clean, teamId, 0]);
  });

  return jsonResponse({ ok: true, id: teamId, message: "Drużyna dodana" });
}

// ========== USUWANIE MECZU (opcjonalne) ==========
function deleteMatch(data) {
  const matchId = Number(data.id);
  if (!matchId) return jsonResponse({ ok: false, error: "Brak ID meczu" });

  const meczeSheet = getSheet("Mecze");
  const bramkiSheet = getSheet("Bramki");
  const zawodnicySheet = getSheet("Zawodnicy");

  // Znajdź i usuń bramki + cofnij statystyki
  const bramkiData = bramkiSheet.getDataRange().getValues();
  for (let i = bramkiData.length - 1; i >= 1; i--) {
    if (Number(bramkiData[i][1]) === matchId) {
      const playerId = Number(bramkiData[i][2]);
      const goals = Number(bramkiData[i][3]) || 1;

      // Cofnij bramki zawodnikowi
      const zawData = zawodnicySheet.getDataRange().getValues();
      for (let j = 1; j < zawData.length; j++) {
        if (Number(zawData[j][0]) === playerId) {
          const current = Number(zawData[j][3]) || 0;
          zawodnicySheet.getRange(j + 1, 4).setValue(Math.max(0, current - goals));
          break;
        }
      }
      bramkiSheet.deleteRow(i + 1);
    }
  }

  // Usuń mecz
  const meczeData = meczeSheet.getDataRange().getValues();
  for (let i = 1; i < meczeData.length; i++) {
    if (Number(meczeData[i][0]) === matchId) {
      meczeSheet.deleteRow(i + 1);
      break;
    }
  }

  return jsonResponse({ ok: true, message: "Mecz usunięty" });
}

// ========== INICJALIZACJA ARKUSZY (uruchom raz ręcznie) ==========
function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Druzyny
  let sh = ss.getSheetByName("Druzyny");
  if (!sh) sh = ss.insertSheet("Druzyny");
  sh.clear();
  sh.appendRow(["id", "nazwa", "aktywna"]);
  sh.appendRow([1, "LARPY FC", "TRUE"]);
  sh.appendRow([2, "FC BARYŁY", "TRUE"]);
  sh.appendRow([3, "PŁOMIEŃ BOBREK", "TRUE"]);
  sh.appendRow([4, "WOLF UNITED", "TRUE"]);

  // Zawodnicy
  sh = ss.getSheetByName("Zawodnicy");
  if (!sh) sh = ss.insertSheet("Zawodnicy");
  sh.clear();
  sh.appendRow(["id", "imie", "id_druzyny", "bramki"]);
  // LARPY FC
  sh.appendRow([1, "Filip Hojka", 1, 0]);
  sh.appendRow([2, "Franek Lubosik", 1, 0]);
  sh.appendRow([3, "Ksawery Jarzębak", 1, 0]);
  sh.appendRow([4, "Kacper Gajowski", 1, 0]);
  // FC BARYŁY
  sh.appendRow([5, "Mateusz Szydłowski", 2, 0]);
  sh.appendRow([6, "Szymon Machtycz", 2, 0]);
  sh.appendRow([7, "Tycjan Karch", 2, 0]);
  sh.appendRow([8, "Kuba Tomyss", 2, 0]);
  // PŁOMIEŃ BOBREK
  sh.appendRow([9, "Kuba Białas", 3, 0]);
  sh.appendRow([10, "Piotr Gajowski", 3, 0]);
  sh.appendRow([11, "Mateusz Czyszoń", 3, 0]);
  sh.appendRow([12, "Piotr Szastok", 3, 0]);
  // WOLF UNITED
  sh.appendRow([13, "Rosti Klymenko", 4, 0]);
  sh.appendRow([14, "Patryk Twardoch", 4, 0]);
  sh.appendRow([15, "Filip Horzela", 4, 0]);
  sh.appendRow([16, "Nikodem Młokosiewicz", 4, 0]);

  // Mecze
  sh = ss.getSheetByName("Mecze");
  if (!sh) sh = ss.insertSheet("Mecze");
  sh.clear();
  sh.appendRow(["id", "data", "druzyna_a", "druzyna_b", "gole_a", "gole_b", "utworzono"]);

  // Bramki
  sh = ss.getSheetByName("Bramki");
  if (!sh) sh = ss.insertSheet("Bramki");
  sh.clear();
  sh.appendRow(["id", "id_meczu", "id_zawodnika", "liczba"]);

  SpreadsheetApp.getUi().alert("Arkusze gotowe! Teraz Deploy → New deployment → Web app");
}

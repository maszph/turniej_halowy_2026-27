# Turniej Halowy – DKS Czarni Kołowa Góra

## Co jest w paczce

- `index.html` – strona publiczna (dla zawodników)
- `admin.html` – panel admina (tylko dla Ciebie)
- `style.css` + `app.js` + `config.js`
- `herb.png` – logo
- `GOOGLE_APPS_SCRIPT.js` – kod do Google Sheets

---

## Krok 1 – Utwórz Google Sheet

1. Wejdź na [sheets.google.com](https://sheets.google.com) i utwórz **nowy pusty arkusz**.
2. Nadaj mu nazwę np. `Turniej Halowy 2025/26`.

---

## Krok 2 – Wklej Apps Script

1. W arkuszu kliknij **Rozszerzenia → Apps Script**.
2. Usuń domyślny kod i wklej **całą zawartość** pliku `GOOGLE_APPS_SCRIPT.js`.
3. Zapisz (Ctrl+S / Cmd+S).
4. W górnym menu wybierz funkcję **`setupSheets`** i kliknij **Uruchom**.
   - Przy pierwszym uruchomieniu Google poprosi o uprawnienia – zatwierdź.
5. Po udanym uruchomieniu w arkuszu pojawią się 4 zakładki:  
   `Druzyny`, `Zawodnicy`, `Mecze`, `Bramki` + wypełnione 4 drużyny.

---

## Krok 3 – Opublikuj jako Web App

1. W edytorze Apps Script kliknij **Deploy → New deployment**.
2. Kliknij ikonę koła zębatego → wybierz **Web app**.
3. Ustaw:
   - **Description**: Turniej Halowy API
   - **Execute as**: Me
   - **Who has access**: **Anyone**
4. Kliknij **Deploy**.
5. Skopiuj wygenerowany **URL** (kończy się na `/exec`).

---

## Krok 4 – Podłącz stronę do arkusza

1. Otwórz plik `config.js`.
2. Wklej skopiowany URL w miejsce:

```js
const API_URL = "https://script.google.com/macros/s/XXXXXXXX/exec";
```

3. Zapisz.

---

## Krok 5 – Wrzuć stronę online (opcjonalnie, ale zalecane)

Najprostsze opcje:

- **Netlify Drop** – przeciągnij cały folder na [app.netlify.com/drop](https://app.netlify.com/drop)
- **GitHub Pages**
- **Cloudflare Pages**
- Albo po prostu trzymaj lokalnie / na dysku i otwieraj `index.html`

Po wrzuceniu online:

- Link dla zawodników → `https://twoja-strona.netlify.app/` (lub index.html)
- Link tylko dla Ciebie → `https://twoja-strona.netlify.app/admin.html`

---

## Hasło admina

Hasło: **`Pawel987!`**

(zmienione jest zarówno w `config.js` jak i w Google Apps Script)

---

## Co możesz robić w panelu admina

1. **Dodaj mecz**
   - Wybierz 2 drużyny
   - Podaj wynik
   - Zaznacz kto strzelił i ile goli
   - Zapisz

2. **Nowa drużyna**
   - Nazwa + minimum 4 zawodników (każdy w osobnej linii)

3. **Lista meczów**
   - Podgląd + możliwość usunięcia meczu (cofają się też bramki zawodników)

---

## Ważne uwagi

- Po każdej zmianie kodu w Apps Script musisz zrobić **nowy deployment** (Deploy → Manage deployments → ołówek → New version).
- Strona publiczna odświeża dane przy każdym wejściu / przełączeniu zakładki.
- Wszystkie dane (wyniki, strzelcy, składy) żyją wyłącznie w Google Sheets.

Powodzenia!

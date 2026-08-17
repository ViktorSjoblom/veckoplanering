# Veckomeny

En PWA för veckoplanering, recept och inköpslistor på svenska.

## Kom igång lokalt

```bash
npm install
npm run dev
```

Öppna http://localhost:5173

## Bygg för produktion

```bash
npm run build
```

Bygget hamnar i `dist/`.

## Deploya till Vercel

**Alternativ 1: Via GitHub (rekommenderas)**

1. Skapa ett nytt repo på GitHub och pusha koden dit:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/DITT-NAMN/veckomeny.git
   git push -u origin main
   ```
2. Gå till https://vercel.com och logga in med GitHub
3. Klicka "Add New Project" och välj ditt repo
4. Vercel upptäcker automatiskt att det är ett Vite-projekt — klicka Deploy
5. Efter ~1 minut får du en URL, t.ex. `veckomeny-xyz.vercel.app`

**Alternativ 2: Via Vercel CLI**

```bash
npm install -g vercel
vercel
```

Följ instruktionerna. Kör `vercel --prod` när du vill deploya till produktions-URL:en.

## Installera på telefonen

**iPhone (Safari):**
1. Öppna URL:en i Safari
2. Tryck på Dela-ikonen (fyrkanten med pilen upp)
3. Scrolla ner och välj "Lägg till på hemskärmen"
4. Appen dyker upp som en ikon på hemskärmen

**Android (Chrome):**
1. Öppna URL:en i Chrome
2. Tryck på menyn (tre prickar uppe till höger)
3. Välj "Installera app" eller "Lägg till på startskärmen"
4. Ikonen läggs till på startskärmen

Efter installation öppnas appen i helskärm utan Chrome/Safari-UI, precis som en vanlig app.

## Data

All data (recept, veckoplan, inköpslista) sparas i webbläsarens localStorage på din enhet. Detta betyder:
- Data följer inte med mellan olika enheter eller webbläsare
- Om du rensar webbläsardata försvinner allt
- Ingen internetuppkoppling krävs efter första besöket

Vill du dela data med familjen krävs en backend (Supabase eller liknande).

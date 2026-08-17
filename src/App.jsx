import React, { useState, useEffect } from 'react';
import { ChefHat, ShoppingBasket, Plus, Trash2, X, Check, Edit3, Calendar, Minus, ArrowLeft, Clock } from 'lucide-react';

// ============== STORAGE POLYFILL ==============
// Wraps localStorage to match the Claude artifact storage API used elsewhere in this file.
// Everything is scoped under "veckomeny:" so we don't collide with anything else on the domain.
if (typeof window !== 'undefined' && !window.storage) {
  const PREFIX = 'veckomeny:';
  window.storage = {
    async get(key) {
      try {
        const raw = localStorage.getItem(PREFIX + key);
        if (raw === null) return null;
        return { key, value: raw, shared: false };
      } catch (e) {
        return null;
      }
    },
    async set(key, value) {
      try {
        localStorage.setItem(PREFIX + key, value);
        return { key, value, shared: false };
      } catch (e) {
        return null;
      }
    },
    async delete(key) {
      try {
        localStorage.removeItem(PREFIX + key);
        return { key, deleted: true, shared: false };
      } catch (e) {
        return null;
      }
    },
    async list(prefix) {
      try {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith(PREFIX)) {
            const stripped = k.slice(PREFIX.length);
            if (!prefix || stripped.startsWith(prefix)) keys.push(stripped);
          }
        }
        return { keys, prefix, shared: false };
      } catch (e) {
        return null;
      }
    },
  };
}


const DAYS = ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag', 'Söndag'];
const DAYS_SHORT = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'];

const CATEGORIES = [
  { id: 'kott', name: 'Kött', emoji: '🥩' },
  { id: 'kyckling', name: 'Kyckling', emoji: '🍗' },
  { id: 'fisk', name: 'Fisk & skaldjur', emoji: '🐟' },
  { id: 'pasta', name: 'Pasta', emoji: '🍝' },
  { id: 'ugn', name: 'Ugnsrätter', emoji: '🥧' },
  { id: 'gryta', name: 'Grytor', emoji: '🍲' },
  { id: 'soppa', name: 'Soppor', emoji: '🥣' },
  { id: 'veg', name: 'Vegetariskt', emoji: '🥗' },
  { id: 'asia', name: 'Asiatiskt', emoji: '🍜' },
  { id: 'snabb', name: 'Snabbt', emoji: '⚡' },
];

const STARTER_RECIPES = [
  // ===== Originalrecept =====
  {
    id: 'r1',
    name: 'Fläskfilégryta med ris',
    portions: 4,
    time: 40,
    categories: ['kott', 'gryta'],
    ingredients: [
      { name: 'Fläskfilé', amount: 600, unit: 'g' },
      { name: 'Gul lök', amount: 1, unit: 'st' },
      { name: 'Vitlöksklyfta', amount: 2, unit: 'st' },
      { name: 'Champinjoner', amount: 250, unit: 'g' },
      { name: 'Vispgrädde', amount: 3, unit: 'dl' },
      { name: 'Köttbuljongtärning', amount: 1, unit: 'st' },
      { name: 'Dijonsenap', amount: 1, unit: 'msk' },
      { name: 'Soja', amount: 1, unit: 'msk' },
      { name: 'Ris', amount: 4, unit: 'dl' },
      { name: 'Smör', amount: 1, unit: 'msk' },
      { name: 'Salt', amount: 1, unit: 'krm' },
      { name: 'Svartpeppar', amount: 1, unit: 'krm' },
    ],
    steps: [
      'Sätt på riset enligt förpackningen.',
      'Skär fläskfilén i skivor, ca 2 cm tjocka. Salta och peppra.',
      'Hacka löken fint och skiva champinjonerna. Pressa vitlöken.',
      'Bryn fläskfilén i smör på hög värme, ca 2 min per sida. Ta upp och lägg åt sidan.',
      'Stek lök, vitlök och champinjoner i samma stekpanna tills löken mjuknat.',
      'Häll i grädde, smulad buljongtärning, dijonsenap och soja. Låt sjuda 5 min.',
      'Lägg tillbaka fläskfilén och låt värmas igenom, 2-3 min. Servera med riset.',
    ],
  },
  {
    id: 'r2',
    name: 'Lax med potatis och yoghurtsås',
    portions: 4,
    time: 35,
    categories: ['fisk'],
    ingredients: [
      { name: 'Laxfilé', amount: 600, unit: 'g' },
      { name: 'Färskpotatis', amount: 1, unit: 'kg' },
      { name: 'Turkisk yoghurt', amount: 3, unit: 'dl' },
      { name: 'Gurka', amount: 0.5, unit: 'st' },
      { name: 'Citron', amount: 1, unit: 'st' },
      { name: 'Färsk dill', amount: 1, unit: 'kruka' },
      { name: 'Vitlöksklyfta', amount: 1, unit: 'st' },
      { name: 'Olivolja', amount: 2, unit: 'msk' },
      { name: 'Salt', amount: 1, unit: 'krm' },
      { name: 'Svartpeppar', amount: 1, unit: 'krm' },
    ],
    steps: [
      'Sätt ugnen på 200°C. Koka potatisen i saltat vatten, ca 15-20 min.',
      'Riv gurkan grovt och krama ur vätskan. Hacka dillen.',
      'Blanda yoghurt, gurka, hälften av dillen, pressad vitlök, en skvätt citronsaft, salt och peppar.',
      'Lägg laxen i en smord ugnsform. Ringla över olivolja, salta och peppra.',
      'Baka laxen i 12-15 min tills den precis är genomstekt.',
      'Servera laxen med potatisen, yoghurtsåsen och resten av dillen. Klyftor av citron vid sidan om.',
    ],
  },
  {
    id: 'r3',
    name: 'Paj med broccoli och skinka',
    portions: 4,
    time: 55,
    categories: ['ugn'],
    ingredients: [
      { name: 'Vetemjöl', amount: 3, unit: 'dl' },
      { name: 'Smör', amount: 125, unit: 'g' },
      { name: 'Vatten', amount: 2, unit: 'msk' },
      { name: 'Broccoli', amount: 1, unit: 'st' },
      { name: 'Skinka', amount: 200, unit: 'g' },
      { name: 'Ägg', amount: 3, unit: 'st' },
      { name: 'Vispgrädde', amount: 2, unit: 'dl' },
      { name: 'Mjölk', amount: 1, unit: 'dl' },
      { name: 'Riven ost', amount: 150, unit: 'g' },
      { name: 'Salt', amount: 1, unit: 'krm' },
      { name: 'Svartpeppar', amount: 1, unit: 'krm' },
    ],
    steps: [
      'Sätt ugnen på 200°C.',
      'Nyp ihop mjöl och smör till en smulig deg. Tillsätt vatten och samla ihop degen.',
      'Tryck ut degen i en pajform (ca 24 cm). Nagga botten med en gaffel.',
      'Förgrädda pajskalet 10 min i mitten av ugnen.',
      'Dela broccolin i buketter och koka 3 min. Skär skinkan i bitar.',
      'Vispa ihop ägg, grädde, mjölk, salt och peppar.',
      'Fördela broccoli och skinka i pajskalet. Häll över äggstanningen och toppa med osten.',
      'Grädda i 25-30 min tills pajen är gyllenbrun och fast.',
    ],
  },
  {
    id: 'r4',
    name: 'Köttfärssås med spaghetti',
    portions: 4,
    time: 40,
    categories: ['kott', 'pasta'],
    ingredients: [
      { name: 'Nötfärs', amount: 500, unit: 'g' },
      { name: 'Gul lök', amount: 1, unit: 'st' },
      { name: 'Vitlöksklyfta', amount: 2, unit: 'st' },
      { name: 'Krossade tomater', amount: 1, unit: 'burk' },
      { name: 'Tomatpuré', amount: 1, unit: 'msk' },
      { name: 'Köttbuljongtärning', amount: 1, unit: 'st' },
      { name: 'Oregano', amount: 1, unit: 'tsk' },
      { name: 'Basilika', amount: 1, unit: 'tsk' },
      { name: 'Spaghetti', amount: 400, unit: 'g' },
      { name: 'Olivolja', amount: 1, unit: 'msk' },
      { name: 'Salt', amount: 1, unit: 'krm' },
      { name: 'Svartpeppar', amount: 1, unit: 'krm' },
    ],
    steps: [
      'Hacka löken och pressa vitlöken.',
      'Fräs lök och vitlök i olivolja tills löken mjuknat.',
      'Tillsätt köttfärsen och bryn den så den blir smulig. Salta och peppra.',
      'Rör i tomatpuré och låt fräsa 1 min.',
      'Häll i krossade tomater, smulad buljongtärning, oregano och basilika. Låt sjuda under lock i minst 20 min.',
      'Koka spaghettin al dente i saltat vatten enligt paketets anvisning.',
      'Smaka av såsen med salt och peppar. Servera med spaghettin.',
    ],
  },

  // ===== Kött =====
  {
    id: 'r5',
    name: 'Pannbiff med lök och brunsås',
    portions: 4,
    time: 50,
    categories: ['kott'],
    ingredients: [
      { name: 'Blandfärs', amount: 600, unit: 'g' },
      { name: 'Gul lök', amount: 2, unit: 'st' },
      { name: 'Ägg', amount: 1, unit: 'st' },
      { name: 'Ströbröd', amount: 1, unit: 'dl' },
      { name: 'Mjölk', amount: 1, unit: 'dl' },
      { name: 'Potatis', amount: 1, unit: 'kg' },
      { name: 'Vispgrädde', amount: 2, unit: 'dl' },
      { name: 'Köttbuljongtärning', amount: 1, unit: 'st' },
      { name: 'Soja', amount: 1, unit: 'msk' },
      { name: 'Smör', amount: 2, unit: 'msk' },
      { name: 'Salt', amount: 1, unit: 'krm' },
      { name: 'Svartpeppar', amount: 1, unit: 'krm' },
    ],
    steps: [
      'Skala och koka potatisen i saltat vatten, ca 20 min.',
      'Blanda ströbröd och mjölk. Låt svälla 5 min.',
      'Blanda i färs, ägg, salt och peppar. Forma till 4-8 platta biffar.',
      'Skiva löken tunt och stek den mjuk och gyllene i smör. Ta upp och lägg åt sidan.',
      'Stek biffarna i samma panna, ca 4 min per sida.',
      'Häll grädde, buljongtärning, soja och 1 dl vatten i pannan. Låt koka ihop några minuter.',
      'Servera biffar med sås, stekt lök och potatis.',
    ],
  },
  {
    id: 'r6',
    name: 'Chili con carne',
    portions: 4,
    time: 45,
    categories: ['kott', 'gryta'],
    ingredients: [
      { name: 'Nötfärs', amount: 600, unit: 'g' },
      { name: 'Gul lök', amount: 2, unit: 'st' },
      { name: 'Vitlöksklyfta', amount: 3, unit: 'st' },
      { name: 'Röd paprika', amount: 1, unit: 'st' },
      { name: 'Krossade tomater', amount: 2, unit: 'burk' },
      { name: 'Kidneybönor', amount: 1, unit: 'burk' },
      { name: 'Majs', amount: 1, unit: 'burk' },
      { name: 'Spiskummin', amount: 1, unit: 'tsk' },
      { name: 'Paprikapulver', amount: 2, unit: 'tsk' },
      { name: 'Chiliflakes', amount: 1, unit: 'tsk' },
      { name: 'Ris', amount: 4, unit: 'dl' },
      { name: 'Crème fraiche', amount: 2, unit: 'dl' },
    ],
    steps: [
      'Sätt på riset enligt förpackningen.',
      'Hacka lök och paprika. Pressa vitlöken.',
      'Bryn nötfärsen i en stor gryta. Salta och peppra.',
      'Tillsätt lök, paprika, vitlök och kryddorna. Fräs 3-4 min.',
      'Häll i krossade tomater. Låt sjuda 20 min.',
      'Skölj bönor och majs och rör ner. Låt värmas igenom 5 min.',
      'Servera med ris och en klick crème fraiche.',
    ],
  },
  {
    id: 'r7',
    name: 'Tacos',
    portions: 4,
    time: 25,
    categories: ['kott', 'snabb'],
    ingredients: [
      { name: 'Nötfärs', amount: 500, unit: 'g' },
      { name: 'Tacokrydda', amount: 1, unit: 'paket' },
      { name: 'Tortillabröd', amount: 8, unit: 'st' },
      { name: 'Salladslök', amount: 1, unit: 'kruka' },
      { name: 'Tomat', amount: 3, unit: 'st' },
      { name: 'Isbergssallad', amount: 1, unit: 'st' },
      { name: 'Gurka', amount: 1, unit: 'st' },
      { name: 'Riven ost', amount: 200, unit: 'g' },
      { name: 'Crème fraiche', amount: 2, unit: 'dl' },
      { name: 'Salsa', amount: 1, unit: 'burk' },
      { name: 'Majs', amount: 1, unit: 'burk' },
    ],
    steps: [
      'Bryn nötfärsen i en stekpanna. Tillsätt tacokrydda och vatten enligt paketet, låt sjuda 5 min.',
      'Skär tomater, gurka och salladslök i små bitar. Strimla salladen.',
      'Värm tortillabröden enligt paketet.',
      'Ställ fram allt i skålar. Alla får bygga sina egna.',
    ],
  },
  {
    id: 'r8',
    name: 'Fläskpannkaka',
    portions: 4,
    time: 60,
    categories: ['kott', 'ugn'],
    ingredients: [
      { name: 'Vetemjöl', amount: 3, unit: 'dl' },
      { name: 'Mjölk', amount: 6, unit: 'dl' },
      { name: 'Ägg', amount: 3, unit: 'st' },
      { name: 'Rökt sidfläsk', amount: 200, unit: 'g' },
      { name: 'Salt', amount: 1, unit: 'krm' },
      { name: 'Lingonsylt', amount: 1, unit: 'burk' },
    ],
    steps: [
      'Sätt ugnen på 225°C.',
      'Vispa ihop mjöl, salt och hälften av mjölken till en slät smet. Tillsätt resten av mjölken och äggen.',
      'Skär sidfläsket i tärningar och stek det knaprigt i en långpanna på spisen.',
      'Häll smeten över fläsket i långpannan.',
      'Grädda mitt i ugnen 30-40 min tills pannkakan är gyllenbrun.',
      'Servera med lingonsylt.',
    ],
  },

  // ===== Kyckling =====
  {
    id: 'r9',
    name: 'Kycklinggryta med curry',
    portions: 4,
    time: 35,
    categories: ['kyckling', 'gryta'],
    ingredients: [
      { name: 'Kycklingfilé', amount: 600, unit: 'g' },
      { name: 'Gul lök', amount: 1, unit: 'st' },
      { name: 'Vitlöksklyfta', amount: 2, unit: 'st' },
      { name: 'Kokosmjölk', amount: 1, unit: 'burk' },
      { name: 'Currypasta', amount: 2, unit: 'msk' },
      { name: 'Röd paprika', amount: 1, unit: 'st' },
      { name: 'Babyspenat', amount: 100, unit: 'g' },
      { name: 'Lime', amount: 1, unit: 'st' },
      { name: 'Färsk koriander', amount: 1, unit: 'kruka' },
      { name: 'Ris', amount: 4, unit: 'dl' },
    ],
    steps: [
      'Sätt på riset enligt förpackningen.',
      'Skär kyckling och paprika i bitar. Hacka löken och pressa vitlöken.',
      'Fräs lök, vitlök och currypasta i olja i 2 min.',
      'Tillsätt kycklingen och bryn den runt om.',
      'Häll i kokosmjölken och lägg i paprikan. Låt sjuda 10 min.',
      'Rör ner spenaten och pressa i limejuice. Smaka av med salt.',
      'Servera med ris och toppa med hackad koriander.',
    ],
  },
  {
    id: 'r10',
    name: 'Ugnsbakad kyckling med klyftpotatis',
    portions: 4,
    time: 55,
    categories: ['kyckling', 'ugn'],
    ingredients: [
      { name: 'Kycklingfilé', amount: 600, unit: 'g' },
      { name: 'Potatis', amount: 1, unit: 'kg' },
      { name: 'Olivolja', amount: 4, unit: 'msk' },
      { name: 'Vitlöksklyfta', amount: 4, unit: 'st' },
      { name: 'Citron', amount: 1, unit: 'st' },
      { name: 'Rosmarin', amount: 2, unit: 'tsk' },
      { name: 'Paprikapulver', amount: 2, unit: 'tsk' },
      { name: 'Salt', amount: 1, unit: 'tsk' },
      { name: 'Svartpeppar', amount: 1, unit: 'krm' },
    ],
    steps: [
      'Sätt ugnen på 225°C.',
      'Skär potatisen i klyftor och lägg i en långpanna. Ringla över hälften av oljan, salt, peppar, rosmarin och 2 pressade vitlöksklyftor.',
      'Rosta potatisen i ugnen i 15 min.',
      'Under tiden: blanda resten av oljan med paprikapulver, resterande vitlök, saften från halva citronen, salt och peppar.',
      'Lägg kycklingfiléerna bland potatisen och pensla med kryddoljan.',
      'Baka vidare i 20-25 min tills kycklingen är genomstekt.',
      'Servera med citronklyftor.',
    ],
  },
  {
    id: 'r11',
    name: 'Kyckling tikka masala',
    portions: 4,
    time: 45,
    categories: ['kyckling', 'gryta', 'asia'],
    ingredients: [
      { name: 'Kycklingfilé', amount: 600, unit: 'g' },
      { name: 'Gul lök', amount: 1, unit: 'st' },
      { name: 'Vitlöksklyfta', amount: 3, unit: 'st' },
      { name: 'Färsk ingefära', amount: 1, unit: 'st' },
      { name: 'Krossade tomater', amount: 1, unit: 'burk' },
      { name: 'Vispgrädde', amount: 3, unit: 'dl' },
      { name: 'Garam masala', amount: 2, unit: 'tsk' },
      { name: 'Paprikapulver', amount: 1, unit: 'tsk' },
      { name: 'Spiskummin', amount: 1, unit: 'tsk' },
      { name: 'Tomatpuré', amount: 1, unit: 'msk' },
      { name: 'Ris', amount: 4, unit: 'dl' },
      { name: 'Naanbröd', amount: 4, unit: 'st' },
    ],
    steps: [
      'Sätt på riset. Skär kycklingen i bitar.',
      'Hacka lök, riv ingefäran och pressa vitlöken.',
      'Bryn kycklingen i olja tills den fått färg. Ta upp.',
      'Fräs lök, vitlök och ingefära i samma panna. Tillsätt kryddorna och tomatpuré, fräs 1 min.',
      'Häll i krossade tomater och grädde. Låt sjuda 5 min.',
      'Lägg tillbaka kycklingen och låt sjuda ytterligare 10 min.',
      'Värm naanbröden. Servera med ris.',
    ],
  },
  {
    id: 'r12',
    name: 'Kycklingwok med nudlar',
    portions: 4,
    time: 25,
    categories: ['kyckling', 'asia', 'snabb'],
    ingredients: [
      { name: 'Kycklingfilé', amount: 500, unit: 'g' },
      { name: 'Äggnudlar', amount: 250, unit: 'g' },
      { name: 'Broccoli', amount: 1, unit: 'st' },
      { name: 'Morot', amount: 2, unit: 'st' },
      { name: 'Röd paprika', amount: 1, unit: 'st' },
      { name: 'Sockerärtor', amount: 150, unit: 'g' },
      { name: 'Vitlöksklyfta', amount: 2, unit: 'st' },
      { name: 'Färsk ingefära', amount: 1, unit: 'st' },
      { name: 'Soja', amount: 3, unit: 'msk' },
      { name: 'Ostronsås', amount: 2, unit: 'msk' },
      { name: 'Sesamolja', amount: 1, unit: 'msk' },
    ],
    steps: [
      'Koka nudlarna enligt paketet. Häll av och skölj i kallt vatten.',
      'Skär kycklingen i strimlor. Skiva morötter och paprika, dela broccolin i små buketter.',
      'Riv ingefäran och pressa vitlöken.',
      'Wokka kycklingen i het olja tills genomstekt. Ta upp.',
      'Wokka grönsakerna 3-4 min. De ska ha kvar lite tuggmotstånd.',
      'Tillbaka med kycklingen. Rör ner ingefära, vitlök, soja och ostronsås.',
      'Blanda i nudlarna och ringla över sesamolja. Blanda väl och servera.',
    ],
  },

  // ===== Fisk & skaldjur =====
  {
    id: 'r13',
    name: 'Fiskgratäng med räkor',
    portions: 4,
    time: 45,
    categories: ['fisk', 'ugn'],
    ingredients: [
      { name: 'Torskfilé', amount: 600, unit: 'g' },
      { name: 'Räkor', amount: 200, unit: 'g' },
      { name: 'Vispgrädde', amount: 3, unit: 'dl' },
      { name: 'Senap', amount: 1, unit: 'msk' },
      { name: 'Fiskbuljongtärning', amount: 1, unit: 'st' },
      { name: 'Färsk dill', amount: 1, unit: 'kruka' },
      { name: 'Riven ost', amount: 100, unit: 'g' },
      { name: 'Potatis', amount: 1, unit: 'kg' },
      { name: 'Citron', amount: 1, unit: 'st' },
      { name: 'Salt', amount: 1, unit: 'krm' },
    ],
    steps: [
      'Sätt ugnen på 200°C. Skala och koka potatisen i saltat vatten.',
      'Lägg torsken i en smord ugnsform. Salta och krama över citron.',
      'Skala räkorna och strö över torsken.',
      'Blanda grädde, senap, smulad buljongtärning och hackad dill. Häll över fisken.',
      'Strö över riven ost.',
      'Baka i ugn 20-25 min tills fisken är genomstekt och osten gyllene.',
      'Servera med potatisen.',
    ],
  },
  {
    id: 'r14',
    name: 'Sushi bowl med lax',
    portions: 4,
    time: 30,
    categories: ['fisk', 'asia'],
    ingredients: [
      { name: 'Laxfilé', amount: 500, unit: 'g' },
      { name: 'Sushiris', amount: 4, unit: 'dl' },
      { name: 'Risvinäger', amount: 3, unit: 'msk' },
      { name: 'Avokado', amount: 2, unit: 'st' },
      { name: 'Gurka', amount: 1, unit: 'st' },
      { name: 'Edamamebönor', amount: 200, unit: 'g' },
      { name: 'Nori', amount: 2, unit: 'st' },
      { name: 'Soja', amount: 4, unit: 'msk' },
      { name: 'Sesamfrön', amount: 2, unit: 'msk' },
      { name: 'Lime', amount: 1, unit: 'st' },
    ],
    steps: [
      'Skölj sushiriset och koka enligt förpackningen. Blanda med risvinäger när det är klart.',
      'Skär laxen i tärningar. Marinera i soja och limejuice medan riset kokar.',
      'Koka edamamebönorna 3 min och skölj i kallt vatten.',
      'Skiva avokado och gurka.',
      'Klipp norin i strimlor.',
      'Lägg upp riset i skålar. Toppa med lax, avokado, gurka, edamame, nori och sesamfrön.',
    ],
  },
  {
    id: 'r15',
    name: 'Fiskpinnar med potatismos',
    portions: 4,
    time: 30,
    categories: ['fisk', 'snabb'],
    ingredients: [
      { name: 'Fiskpinnar', amount: 1, unit: 'paket' },
      { name: 'Potatis', amount: 1, unit: 'kg' },
      { name: 'Mjölk', amount: 1, unit: 'dl' },
      { name: 'Smör', amount: 50, unit: 'g' },
      { name: 'Citron', amount: 1, unit: 'st' },
      { name: 'Ärtor', amount: 300, unit: 'g' },
      { name: 'Remouladsås', amount: 1, unit: 'burk' },
    ],
    steps: [
      'Sätt ugnen på 225°C. Skala och koka potatisen.',
      'Lägg fiskpinnarna på en plåt och grädda enligt paketet, ca 15 min.',
      'Värm ärtorna i lite vatten eller ånga dem.',
      'Mosa potatisen med varm mjölk och smör. Salta.',
      'Servera fiskpinnar med mos, ärtor, remouladsås och citronklyftor.',
    ],
  },
  {
    id: 'r16',
    name: 'Räkpasta med vitlök och chili',
    portions: 4,
    time: 20,
    categories: ['fisk', 'pasta', 'snabb'],
    ingredients: [
      { name: 'Räkor', amount: 400, unit: 'g' },
      { name: 'Spaghetti', amount: 400, unit: 'g' },
      { name: 'Vitlöksklyfta', amount: 4, unit: 'st' },
      { name: 'Chiliflakes', amount: 1, unit: 'tsk' },
      { name: 'Citron', amount: 1, unit: 'st' },
      { name: 'Färsk persilja', amount: 1, unit: 'kruka' },
      { name: 'Olivolja', amount: 1, unit: 'dl' },
      { name: 'Vitt vin', amount: 1, unit: 'dl' },
      { name: 'Smör', amount: 50, unit: 'g' },
    ],
    steps: [
      'Koka spaghettin i välsaltat vatten.',
      'Skala räkorna. Skiva vitlöken tunt.',
      'Värm olivoljan i en stor stekpanna. Fräs vitlök och chili på låg värme, låt inte bli brunt.',
      'Häll i vinet och låt koka in till hälften.',
      'Tillsätt räkorna och smör. Låt fräsa 1-2 min.',
      'Blanda pastan i pannan med en skvätt pastavatten. Toppa med citronskal, saft och hackad persilja.',
    ],
  },

  // ===== Pasta =====
  {
    id: 'r17',
    name: 'Pasta carbonara',
    portions: 4,
    time: 20,
    categories: ['pasta', 'snabb'],
    ingredients: [
      { name: 'Spaghetti', amount: 400, unit: 'g' },
      { name: 'Pancetta', amount: 200, unit: 'g' },
      { name: 'Äggula', amount: 4, unit: 'st' },
      { name: 'Pecorino', amount: 100, unit: 'g' },
      { name: 'Parmesan', amount: 50, unit: 'g' },
      { name: 'Svartpeppar', amount: 1, unit: 'tsk' },
      { name: 'Salt', amount: 1, unit: 'krm' },
    ],
    steps: [
      'Sätt vatten till kokning och salta ordentligt.',
      'Skär pancettan i små tärningar. Stek den knaprig i torr panna på medelvärme.',
      'Riv ostarna. Vispa ihop äggulor, ostar och rikligt med svartpeppar i en skål.',
      'Koka spaghettin al dente enligt paketet.',
      'Ta av pancettan från värmen. Häll av pastan men spara 1 dl pastavatten.',
      'Vänd pastan i pancettapannan (av värmen). Häll över äggblandningen och rör snabbt. Späd med pastavatten till krämig konsistens.',
      'Servera direkt med extra pecorino och peppar.',
    ],
  },
  {
    id: 'r18',
    name: 'Lasagne',
    portions: 6,
    time: 75,
    categories: ['pasta', 'kott', 'ugn'],
    ingredients: [
      { name: 'Nötfärs', amount: 600, unit: 'g' },
      { name: 'Gul lök', amount: 1, unit: 'st' },
      { name: 'Vitlöksklyfta', amount: 3, unit: 'st' },
      { name: 'Krossade tomater', amount: 2, unit: 'burk' },
      { name: 'Tomatpuré', amount: 2, unit: 'msk' },
      { name: 'Lasagneplattor', amount: 1, unit: 'paket' },
      { name: 'Smör', amount: 50, unit: 'g' },
      { name: 'Vetemjöl', amount: 3, unit: 'msk' },
      { name: 'Mjölk', amount: 6, unit: 'dl' },
      { name: 'Riven ost', amount: 250, unit: 'g' },
      { name: 'Oregano', amount: 1, unit: 'tsk' },
      { name: 'Salt', amount: 1, unit: 'krm' },
    ],
    steps: [
      'Sätt ugnen på 200°C.',
      'Hacka lök och pressa vitlöken. Fräs mjukt i olja.',
      'Bryn färsen tills smulig. Tillsätt tomatpuré, krossade tomater, oregano, salt och peppar. Låt sjuda 15 min.',
      'Bechamelsås: smält smöret, rör i mjölet. Vispa i mjölken lite i taget. Låt sjuda 5 min till slät sås. Krydda med salt och muskot.',
      'Varva köttfärssås, lasagneplattor och bechamel i en ugnsform. Avsluta med bechamel överst.',
      'Toppa med riven ost.',
      'Grädda 35-40 min tills gyllenbrun. Låt vila 5 min innan servering.',
    ],
  },
  {
    id: 'r19',
    name: 'Krämig kycklingpasta',
    portions: 4,
    time: 30,
    categories: ['pasta', 'kyckling'],
    ingredients: [
      { name: 'Kycklingfilé', amount: 500, unit: 'g' },
      { name: 'Penne', amount: 400, unit: 'g' },
      { name: 'Bacon', amount: 150, unit: 'g' },
      { name: 'Soltorkade tomater', amount: 100, unit: 'g' },
      { name: 'Vispgrädde', amount: 3, unit: 'dl' },
      { name: 'Babyspenat', amount: 100, unit: 'g' },
      { name: 'Vitlöksklyfta', amount: 2, unit: 'st' },
      { name: 'Parmesan', amount: 50, unit: 'g' },
      { name: 'Salt', amount: 1, unit: 'krm' },
    ],
    steps: [
      'Koka pennen enligt paketet.',
      'Skär kycklingen i strimlor och baconet i bitar.',
      'Stek bacon knaprigt i en stor stekpanna. Ta upp.',
      'Stek kycklingen i baconfettet tills genomstekt. Salta och peppra.',
      'Pressa i vitlöken och tillsätt hackade soltorkade tomater. Fräs 1 min.',
      'Häll i grädde och låt sjuda 3 min. Rör ner spenaten.',
      'Blanda i pastan och baconet. Toppa med riven parmesan.',
    ],
  },
  {
    id: 'r20',
    name: 'Pesto-pasta med körsbärstomater',
    portions: 4,
    time: 15,
    categories: ['pasta', 'veg', 'snabb'],
    ingredients: [
      { name: 'Penne', amount: 400, unit: 'g' },
      { name: 'Pesto', amount: 1, unit: 'burk' },
      { name: 'Körsbärstomater', amount: 250, unit: 'g' },
      { name: 'Mozzarella', amount: 1, unit: 'paket' },
      { name: 'Pinjenötter', amount: 50, unit: 'g' },
      { name: 'Färsk basilika', amount: 1, unit: 'kruka' },
      { name: 'Olivolja', amount: 2, unit: 'msk' },
    ],
    steps: [
      'Koka pennen al dente enligt paketet. Spara 1 dl pastavatten.',
      'Rosta pinjenötterna i torr panna tills gyllene. Se upp så de inte bränns.',
      'Halvera körsbärstomaterna. Riv eller tärna mozzarellan.',
      'Blanda pastan med pesto och en skvätt pastavatten till krämig konsistens.',
      'Rör ner tomater och mozzarella. Toppa med pinjenötter och basilika.',
    ],
  },

  // ===== Ugnsrätter =====
  {
    id: 'r21',
    name: 'Janssons frestelse',
    portions: 4,
    time: 60,
    categories: ['ugn', 'fisk'],
    ingredients: [
      { name: 'Potatis', amount: 1, unit: 'kg' },
      { name: 'Gul lök', amount: 2, unit: 'st' },
      { name: 'Ansjovis', amount: 1, unit: 'burk' },
      { name: 'Vispgrädde', amount: 3, unit: 'dl' },
      { name: 'Mjölk', amount: 2, unit: 'dl' },
      { name: 'Ströbröd', amount: 1, unit: 'dl' },
      { name: 'Smör', amount: 50, unit: 'g' },
      { name: 'Svartpeppar', amount: 1, unit: 'krm' },
    ],
    steps: [
      'Sätt ugnen på 225°C. Smöra en ugnsform.',
      'Skala potatisen och skär i tunna stavar (som pommes).',
      'Skiva löken tunt. Fräs mjuk i lite smör.',
      'Varva potatis, lök och ansjovis i formen. Peppra mellan lagren.',
      'Häll grädde och mjölk över, plus lite ansjovislag.',
      'Toppa med ströbröd och små smörklickar.',
      'Grädda 45 min tills potatisen är mjuk och toppen gyllenbrun.',
    ],
  },
  {
    id: 'r22',
    name: 'Moussaka',
    portions: 6,
    time: 90,
    categories: ['ugn', 'kott'],
    ingredients: [
      { name: 'Lammfärs', amount: 600, unit: 'g' },
      { name: 'Aubergine', amount: 2, unit: 'st' },
      { name: 'Potatis', amount: 500, unit: 'g' },
      { name: 'Gul lök', amount: 1, unit: 'st' },
      { name: 'Vitlöksklyfta', amount: 2, unit: 'st' },
      { name: 'Krossade tomater', amount: 1, unit: 'burk' },
      { name: 'Kanel', amount: 1, unit: 'tsk' },
      { name: 'Smör', amount: 50, unit: 'g' },
      { name: 'Vetemjöl', amount: 3, unit: 'msk' },
      { name: 'Mjölk', amount: 5, unit: 'dl' },
      { name: 'Ägg', amount: 2, unit: 'st' },
      { name: 'Riven ost', amount: 150, unit: 'g' },
    ],
    steps: [
      'Sätt ugnen på 200°C.',
      'Skiva aubergine och potatis i ½ cm skivor. Pensla med olja, lägg på plåtar och rosta 20 min.',
      'Hacka lök och pressa vitlök. Bryn lammfärsen. Tillsätt lök, vitlök och kanel.',
      'Häll i krossade tomater. Låt sjuda 15 min. Salta och peppra.',
      'Bechamelsås: smält smör, rör i mjöl, vispa i mjölken. Låt sjuda 5 min. Ta av från värmen och rör i uppvispade ägg.',
      'Varva potatis, aubergine och köttfärssås i en ugnsform. Avsluta med bechamel.',
      'Toppa med riven ost. Grädda 35-40 min tills gyllenbrun. Låt vila 10 min.',
    ],
  },
  {
    id: 'r23',
    name: 'Korv stroganoff i ugn',
    portions: 4,
    time: 45,
    categories: ['ugn', 'kott', 'snabb'],
    ingredients: [
      { name: 'Falukorv', amount: 800, unit: 'g' },
      { name: 'Gul lök', amount: 2, unit: 'st' },
      { name: 'Krossade tomater', amount: 1, unit: 'burk' },
      { name: 'Vispgrädde', amount: 2, unit: 'dl' },
      { name: 'Tomatpuré', amount: 2, unit: 'msk' },
      { name: 'Senap', amount: 1, unit: 'msk' },
      { name: 'Soja', amount: 1, unit: 'msk' },
      { name: 'Ris', amount: 4, unit: 'dl' },
      { name: 'Svartpeppar', amount: 1, unit: 'krm' },
    ],
    steps: [
      'Sätt ugnen på 225°C. Sätt på riset.',
      'Skär falukorven i stavar och lägg i en ugnsform.',
      'Skiva löken och lägg ovanpå korven.',
      'Blanda krossade tomater, grädde, tomatpuré, senap, soja och peppar. Häll över.',
      'Baka i ugn 25-30 min tills det bubblar och fått lite färg.',
      'Servera med riset.',
    ],
  },

  // ===== Grytor =====
  {
    id: 'r24',
    name: 'Boeuf bourguignon',
    portions: 6,
    time: 180,
    categories: ['gryta', 'kott'],
    ingredients: [
      { name: 'Högrev', amount: 1, unit: 'kg' },
      { name: 'Bacon', amount: 200, unit: 'g' },
      { name: 'Gul lök', amount: 2, unit: 'st' },
      { name: 'Morot', amount: 3, unit: 'st' },
      { name: 'Vitlöksklyfta', amount: 4, unit: 'st' },
      { name: 'Champinjoner', amount: 300, unit: 'g' },
      { name: 'Rödvin', amount: 5, unit: 'dl' },
      { name: 'Köttbuljong', amount: 5, unit: 'dl' },
      { name: 'Tomatpuré', amount: 2, unit: 'msk' },
      { name: 'Timjan', amount: 2, unit: 'tsk' },
      { name: 'Lagerblad', amount: 2, unit: 'st' },
      { name: 'Vetemjöl', amount: 2, unit: 'msk' },
    ],
    steps: [
      'Sätt ugnen på 150°C. Skär köttet i stora kuber, ca 4 cm.',
      'Stek baconet knaprigt i en gjutjärnsgryta. Ta upp.',
      'Bryn köttet i omgångar i baconfettet. Salta och peppra.',
      'Grovhacka lök, morot och vitlök. Fräs i grytan tills lökarna mjuknat.',
      'Rör i tomatpuré och mjöl. Fräs 2 min.',
      'Häll i vin och buljong. Lägg tillbaka kött, bacon, timjan och lagerblad.',
      'Sätt in i ugnen med lock i 2-2,5 timmar.',
      'Bryn champinjonerna separat sista 15 min och rör ner. Smaka av med salt och peppar.',
    ],
  },
  {
    id: 'r25',
    name: 'Kalops',
    portions: 4,
    time: 120,
    categories: ['gryta', 'kott'],
    ingredients: [
      { name: 'Högrev', amount: 800, unit: 'g' },
      { name: 'Gul lök', amount: 2, unit: 'st' },
      { name: 'Morot', amount: 3, unit: 'st' },
      { name: 'Köttbuljongtärning', amount: 2, unit: 'st' },
      { name: 'Kryddpeppar', amount: 10, unit: 'st' },
      { name: 'Lagerblad', amount: 2, unit: 'st' },
      { name: 'Vetemjöl', amount: 2, unit: 'msk' },
      { name: 'Potatis', amount: 1, unit: 'kg' },
      { name: 'Rödbetor', amount: 1, unit: 'burk' },
    ],
    steps: [
      'Skär köttet i kuber. Vänd i mjöl blandat med salt.',
      'Bryn köttet i smör i en gryta. Ta upp.',
      'Grovhacka lök och morot. Fräs mjukt i grytan.',
      'Lägg tillbaka köttet. Häll på vatten så det precis täcker.',
      'Tillsätt smulad buljong, kryddpeppar och lagerblad. Låt sjuda under lock 1,5 timme.',
      'Koka potatisen sista halvtimmen.',
      'Smaka av grytan. Servera med potatis och inlagda rödbetor.',
    ],
  },
  {
    id: 'r26',
    name: 'Marockansk lammgryta',
    portions: 4,
    time: 90,
    categories: ['gryta', 'kott'],
    ingredients: [
      { name: 'Lammkött', amount: 800, unit: 'g' },
      { name: 'Gul lök', amount: 2, unit: 'st' },
      { name: 'Vitlöksklyfta', amount: 3, unit: 'st' },
      { name: 'Morot', amount: 2, unit: 'st' },
      { name: 'Kikärtor', amount: 1, unit: 'burk' },
      { name: 'Krossade tomater', amount: 1, unit: 'burk' },
      { name: 'Aprikoser', amount: 100, unit: 'g' },
      { name: 'Ras el hanout', amount: 2, unit: 'msk' },
      { name: 'Kanel', amount: 1, unit: 'tsk' },
      { name: 'Couscous', amount: 3, unit: 'dl' },
      { name: 'Färsk koriander', amount: 1, unit: 'kruka' },
    ],
    steps: [
      'Skär lammet i kuber. Salta och peppra.',
      'Bryn lammet i olja i en gryta. Ta upp.',
      'Hacka lök, vitlök och morot. Fräs i grytan tills mjukt.',
      'Rör i kryddorna och fräs 1 min.',
      'Lägg tillbaka lammet. Tillsätt krossade tomater, hackade aprikoser och vatten så det täcker.',
      'Låt sjuda under lock i 1 timme.',
      'Rör ner sköljda kikärtor sista 10 min.',
      'Koka couscousen enligt paketet. Servera med grytan och hackad koriander.',
    ],
  },

  // ===== Soppor =====
  {
    id: 'r27',
    name: 'Köttfärssoppa',
    portions: 4,
    time: 40,
    categories: ['soppa', 'kott'],
    ingredients: [
      { name: 'Nötfärs', amount: 400, unit: 'g' },
      { name: 'Potatis', amount: 4, unit: 'st' },
      { name: 'Morot', amount: 3, unit: 'st' },
      { name: 'Purjolök', amount: 1, unit: 'st' },
      { name: 'Gul lök', amount: 1, unit: 'st' },
      { name: 'Krossade tomater', amount: 1, unit: 'burk' },
      { name: 'Köttbuljongtärning', amount: 2, unit: 'st' },
      { name: 'Vatten', amount: 1, unit: 'l' },
      { name: 'Lagerblad', amount: 2, unit: 'st' },
      { name: 'Salt', amount: 1, unit: 'krm' },
    ],
    steps: [
      'Bryn nötfärsen i en stor gryta. Salta och peppra.',
      'Hacka lök och purjolök. Skala och tärna potatis och morötter.',
      'Tillsätt löken till färsen och fräs mjuk.',
      'Häll i vattnet med smulad buljong. Tillsätt tomat, potatis, morötter och lagerblad.',
      'Låt sjuda under lock i 20 min tills potatisen är mjuk.',
      'Rör ner purjolöken sista 5 min. Smaka av.',
    ],
  },
  {
    id: 'r28',
    name: 'Ramen med kyckling',
    portions: 4,
    time: 40,
    categories: ['soppa', 'asia', 'kyckling'],
    ingredients: [
      { name: 'Kycklinglårfilé', amount: 500, unit: 'g' },
      { name: 'Ramen-nudlar', amount: 4, unit: 'paket' },
      { name: 'Kycklingbuljong', amount: 1, unit: 'l' },
      { name: 'Vitlöksklyfta', amount: 3, unit: 'st' },
      { name: 'Färsk ingefära', amount: 1, unit: 'st' },
      { name: 'Soja', amount: 4, unit: 'msk' },
      { name: 'Miso', amount: 2, unit: 'msk' },
      { name: 'Ägg', amount: 4, unit: 'st' },
      { name: 'Pak choi', amount: 200, unit: 'g' },
      { name: 'Salladslök', amount: 1, unit: 'kruka' },
      { name: 'Sesamolja', amount: 1, unit: 'msk' },
      { name: 'Nori', amount: 2, unit: 'st' },
    ],
    steps: [
      'Koka äggen 6,5 min för rinnig gula. Skölj kallt och skala.',
      'Skiva kycklingen och stek den i olja med hälften av vitlöken och riven ingefära.',
      'Koka upp buljongen med resten av vitlöken, soja och miso. Låt sjuda 10 min.',
      'Koka ramen-nudlarna enligt paketet, separat.',
      'Dela pak choi på längden och lägg i buljongen sista 3 min.',
      'Lägg upp nudlar i skålar. Häll över buljong och pak choi. Toppa med kyckling, halverat ägg, strimlad nori och salladslök.',
      'Ringla över sesamolja.',
    ],
  },
  {
    id: 'r29',
    name: 'Tomatsoppa med grillad ost',
    portions: 4,
    time: 25,
    categories: ['soppa', 'veg', 'snabb'],
    ingredients: [
      { name: 'Krossade tomater', amount: 2, unit: 'burk' },
      { name: 'Gul lök', amount: 1, unit: 'st' },
      { name: 'Vitlöksklyfta', amount: 2, unit: 'st' },
      { name: 'Grönsaksbuljong', amount: 5, unit: 'dl' },
      { name: 'Vispgrädde', amount: 2, unit: 'dl' },
      { name: 'Färsk basilika', amount: 1, unit: 'kruka' },
      { name: 'Smörgåsbröd', amount: 8, unit: 'st' },
      { name: 'Cheddar', amount: 200, unit: 'g' },
      { name: 'Smör', amount: 50, unit: 'g' },
    ],
    steps: [
      'Hacka lök och vitlök. Fräs mjukt i olja i en gryta.',
      'Tillsätt krossade tomater och buljong. Låt sjuda 15 min.',
      'Mixa soppan slät med stavmixer. Rör i grädden. Smaka av med salt och peppar.',
      'Bygg macka med två brödskivor och riven ost. Bred smör på utsidan.',
      'Grilla mackorna gyllene i stekpanna, ca 3 min per sida.',
      'Servera soppan toppad med basilika och mackan bredvid.',
    ],
  },
  {
    id: 'r30',
    name: 'Linssoppa med kokos',
    portions: 4,
    time: 30,
    categories: ['soppa', 'veg'],
    ingredients: [
      { name: 'Röda linser', amount: 3, unit: 'dl' },
      { name: 'Kokosmjölk', amount: 1, unit: 'burk' },
      { name: 'Krossade tomater', amount: 1, unit: 'burk' },
      { name: 'Gul lök', amount: 1, unit: 'st' },
      { name: 'Vitlöksklyfta', amount: 2, unit: 'st' },
      { name: 'Färsk ingefära', amount: 1, unit: 'st' },
      { name: 'Spiskummin', amount: 1, unit: 'tsk' },
      { name: 'Garam masala', amount: 1, unit: 'tsk' },
      { name: 'Grönsaksbuljong', amount: 5, unit: 'dl' },
      { name: 'Babyspenat', amount: 100, unit: 'g' },
      { name: 'Lime', amount: 1, unit: 'st' },
    ],
    steps: [
      'Hacka lök, pressa vitlök och riv ingefäran.',
      'Fräs lök, vitlök och ingefära i olja med kryddorna i 2 min.',
      'Skölj linserna och tillsätt i grytan.',
      'Häll i krossade tomater, kokosmjölk och buljong. Låt sjuda 15 min tills linserna är mjuka.',
      'Rör ner spenaten och pressa i limejuice. Smaka av.',
    ],
  },

  // ===== Vegetariskt =====
  {
    id: 'r31',
    name: 'Halloumiwrap med myntayoghurt',
    portions: 4,
    time: 20,
    categories: ['veg', 'snabb'],
    ingredients: [
      { name: 'Halloumi', amount: 2, unit: 'paket' },
      { name: 'Tortillabröd', amount: 8, unit: 'st' },
      { name: 'Turkisk yoghurt', amount: 3, unit: 'dl' },
      { name: 'Färsk mynta', amount: 1, unit: 'kruka' },
      { name: 'Gurka', amount: 1, unit: 'st' },
      { name: 'Tomat', amount: 3, unit: 'st' },
      { name: 'Rödlök', amount: 1, unit: 'st' },
      { name: 'Isbergssallad', amount: 1, unit: 'st' },
      { name: 'Vitlöksklyfta', amount: 1, unit: 'st' },
      { name: 'Citron', amount: 1, unit: 'st' },
    ],
    steps: [
      'Skiva halloumin i ½ cm skivor.',
      'Hacka mynta och blanda med yoghurt, pressad vitlök, citronsaft, salt och peppar.',
      'Skär tomat och gurka i tärningar, strimla sallad och skiva rödlök tunt.',
      'Stek halloumin gyllene i torr panna, ca 2 min per sida.',
      'Värm tortillabröden.',
      'Bygg wraps: myntayoghurt, sallad, grönsaker och halloumi. Rulla ihop.',
    ],
  },
  {
    id: 'r32',
    name: 'Vegetarisk lasagne med linser',
    portions: 6,
    time: 75,
    categories: ['veg', 'ugn', 'pasta'],
    ingredients: [
      { name: 'Röda linser', amount: 3, unit: 'dl' },
      { name: 'Krossade tomater', amount: 2, unit: 'burk' },
      { name: 'Morot', amount: 2, unit: 'st' },
      { name: 'Gul lök', amount: 1, unit: 'st' },
      { name: 'Vitlöksklyfta', amount: 3, unit: 'st' },
      { name: 'Lasagneplattor', amount: 1, unit: 'paket' },
      { name: 'Smör', amount: 50, unit: 'g' },
      { name: 'Vetemjöl', amount: 3, unit: 'msk' },
      { name: 'Mjölk', amount: 6, unit: 'dl' },
      { name: 'Riven ost', amount: 200, unit: 'g' },
      { name: 'Oregano', amount: 1, unit: 'tsk' },
    ],
    steps: [
      'Sätt ugnen på 200°C.',
      'Hacka lök och riv morötter. Pressa vitlöken. Fräs mjukt i olja.',
      'Tillsätt sköljda linser, krossade tomater, oregano och 3 dl vatten. Låt sjuda 15 min.',
      'Bechamel: smält smör, rör i mjöl, vispa i mjölk. Låt sjuda 5 min. Salt och muskot.',
      'Varva linssås, lasagneplattor och bechamel i en ugnsform.',
      'Toppa med bechamel och riven ost.',
      'Grädda 30-35 min tills gyllenbrun.',
    ],
  },
  {
    id: 'r33',
    name: 'Linsbiffar med ugnsrostade rotsaker',
    portions: 4,
    time: 60,
    categories: ['veg', 'ugn'],
    ingredients: [
      { name: 'Röda linser', amount: 3, unit: 'dl' },
      { name: 'Ägg', amount: 1, unit: 'st' },
      { name: 'Havregryn', amount: 1, unit: 'dl' },
      { name: 'Gul lök', amount: 1, unit: 'st' },
      { name: 'Vitlöksklyfta', amount: 2, unit: 'st' },
      { name: 'Spiskummin', amount: 1, unit: 'tsk' },
      { name: 'Morot', amount: 3, unit: 'st' },
      { name: 'Palsternacka', amount: 2, unit: 'st' },
      { name: 'Sötpotatis', amount: 1, unit: 'st' },
      { name: 'Olivolja', amount: 3, unit: 'msk' },
      { name: 'Tahini', amount: 2, unit: 'msk' },
    ],
    steps: [
      'Sätt ugnen på 225°C.',
      'Skala och skär rotsakerna i klyftor. Lägg på plåt med olja och salt. Rosta 30-35 min.',
      'Koka linserna i saltat vatten i 10 min tills mjuka. Häll av väl.',
      'Fräs hackad lök och pressad vitlök mjuk. Rör ner i linserna.',
      'Blanda linser, havregryn, ägg, spiskummin, salt och peppar. Låt svälla 10 min.',
      'Forma till 8 biffar. Stek gyllene i olja, ca 3 min per sida.',
      'Blanda tahini med vatten och citron till en sås. Servera med biffar och rotsaker.',
    ],
  },

  // ===== Asiatiskt =====
  {
    id: 'r34',
    name: 'Pad thai',
    portions: 4,
    time: 30,
    categories: ['asia'],
    ingredients: [
      { name: 'Risnudlar', amount: 250, unit: 'g' },
      { name: 'Kycklingfilé', amount: 400, unit: 'g' },
      { name: 'Ägg', amount: 2, unit: 'st' },
      { name: 'Böngroddar', amount: 200, unit: 'g' },
      { name: 'Salladslök', amount: 1, unit: 'kruka' },
      { name: 'Vitlöksklyfta', amount: 3, unit: 'st' },
      { name: 'Jordnötter', amount: 100, unit: 'g' },
      { name: 'Lime', amount: 2, unit: 'st' },
      { name: 'Fisksås', amount: 3, unit: 'msk' },
      { name: 'Soja', amount: 2, unit: 'msk' },
      { name: 'Tamarindpasta', amount: 2, unit: 'msk' },
      { name: 'Palmsocker', amount: 2, unit: 'msk' },
      { name: 'Färsk koriander', amount: 1, unit: 'kruka' },
    ],
    steps: [
      'Lägg risnudlarna i blöt i varmt vatten enligt paketet.',
      'Blanda fisksås, soja, tamarind, palmsocker och saft från 1 lime till en sås.',
      'Skär kycklingen i strimlor. Hacka vitlök, salladslök och jordnötter grovt.',
      'Wokka kycklingen i het olja tills genomstekt. Skjut åt sidan.',
      'Knäck äggen i wokken och rör runt tills stelnade.',
      'Tillsätt vitlök, avrunna nudlar och såsen. Blanda väl 2 min.',
      'Rör ner böngroddar och hälften av salladslöken.',
      'Servera med jordnötter, koriander, resten av salladslöken och limeklyftor.',
    ],
  },
  {
    id: 'r35',
    name: 'Bibimbap',
    portions: 4,
    time: 40,
    categories: ['asia'],
    ingredients: [
      { name: 'Nötfärs', amount: 400, unit: 'g' },
      { name: 'Ris', amount: 4, unit: 'dl' },
      { name: 'Ägg', amount: 4, unit: 'st' },
      { name: 'Morot', amount: 2, unit: 'st' },
      { name: 'Spenat', amount: 200, unit: 'g' },
      { name: 'Champinjoner', amount: 200, unit: 'g' },
      { name: 'Böngroddar', amount: 200, unit: 'g' },
      { name: 'Gochujang', amount: 3, unit: 'msk' },
      { name: 'Soja', amount: 3, unit: 'msk' },
      { name: 'Sesamolja', amount: 2, unit: 'msk' },
      { name: 'Sesamfrön', amount: 2, unit: 'msk' },
      { name: 'Vitlöksklyfta', amount: 2, unit: 'st' },
    ],
    steps: [
      'Koka riset. Blanda nötfärs med hälften av sojan, pressad vitlök och lite sesamolja. Bryn i panna.',
      'Strimla morötterna och stek snabbt i lite olja med en nypa salt. Ta upp.',
      'Wokka spenaten tills den faller ihop. Blanda med sesamolja och salt. Ta upp.',
      'Skiva champinjonerna och stek med soja tills gyllene.',
      'Blanchera böngroddarna 1 min. Skölj kallt.',
      'Stek äggen med rinnig gula.',
      'Lägg upp ris i skålar. Arrangera grönsaker och färs runt. Topp med ägg och sesamfrön. Servera med gochujang.',
    ],
  },
  {
    id: 'r36',
    name: 'Gyoza med dipsås',
    portions: 4,
    time: 60,
    categories: ['asia'],
    ingredients: [
      { name: 'Gyoza-skal', amount: 1, unit: 'paket' },
      { name: 'Fläskfärs', amount: 400, unit: 'g' },
      { name: 'Vitkål', amount: 200, unit: 'g' },
      { name: 'Salladslök', amount: 1, unit: 'kruka' },
      { name: 'Vitlöksklyfta', amount: 2, unit: 'st' },
      { name: 'Färsk ingefära', amount: 1, unit: 'st' },
      { name: 'Soja', amount: 4, unit: 'msk' },
      { name: 'Sesamolja', amount: 2, unit: 'msk' },
      { name: 'Risvinäger', amount: 3, unit: 'msk' },
      { name: 'Chiliolja', amount: 1, unit: 'msk' },
    ],
    steps: [
      'Hacka vitkålen mycket fint, salta och låt stå 10 min. Krama ur vätskan.',
      'Blanda färs, vitkål, hackad salladslök, pressad vitlök, riven ingefära, 2 msk soja och 1 msk sesamolja.',
      'Lägg en tsk fyllning på varje skal. Blöt kanterna med vatten och vik ihop till halvmånar med veck.',
      'Stek gyozan i olja i het panna tills botten är gyllene, ca 2 min.',
      'Häll i 1 dl vatten och lägg på lock. Ånga 5-6 min tills vattnet dunstat.',
      'Blanda resten av sojan med risvinäger, chiliolja och lite sesamolja till dipsås.',
      'Servera gyozan med dipsåsen.',
    ],
  },
  {
    id: 'r37',
    name: 'Mapo tofu',
    portions: 4,
    time: 25,
    categories: ['asia', 'snabb'],
    ingredients: [
      { name: 'Tofu', amount: 500, unit: 'g' },
      { name: 'Fläskfärs', amount: 200, unit: 'g' },
      { name: 'Doubanjiang', amount: 2, unit: 'msk' },
      { name: 'Vitlöksklyfta', amount: 4, unit: 'st' },
      { name: 'Färsk ingefära', amount: 1, unit: 'st' },
      { name: 'Salladslök', amount: 1, unit: 'kruka' },
      { name: 'Soja', amount: 2, unit: 'msk' },
      { name: 'Sichuanpeppar', amount: 1, unit: 'tsk' },
      { name: 'Sesamolja', amount: 1, unit: 'msk' },
      { name: 'Ris', amount: 4, unit: 'dl' },
    ],
    steps: [
      'Sätt på riset.',
      'Skär tofun i 2 cm kuber. Lägg i skål med kokande saltat vatten i 5 min. Häll av försiktigt.',
      'Rosta sichuanpeppar torr i panna 1 min. Mortla eller mal.',
      'Wokka fläskfärsen i olja tills smulig och gyllene.',
      'Rör i doubanjiang, hackad vitlök och riven ingefära. Fräs 1 min.',
      'Häll i 2 dl vatten och soja. Låt sjuda.',
      'Lägg försiktigt i tofun. Låt sjuda 5 min. Ringla över sesamolja.',
      'Toppa med hackad salladslök och den rostade sichuanpepparn. Servera med ris.',
    ],
  },

  // ===== Snabbt =====
  {
    id: 'r38',
    name: 'Omelett med ost och skinka',
    portions: 2,
    time: 10,
    categories: ['snabb'],
    ingredients: [
      { name: 'Ägg', amount: 6, unit: 'st' },
      { name: 'Mjölk', amount: 1, unit: 'dl' },
      { name: 'Skinka', amount: 100, unit: 'g' },
      { name: 'Riven ost', amount: 100, unit: 'g' },
      { name: 'Smör', amount: 2, unit: 'msk' },
      { name: 'Salt', amount: 1, unit: 'krm' },
      { name: 'Svartpeppar', amount: 1, unit: 'krm' },
    ],
    steps: [
      'Vispa ihop ägg, mjölk, salt och peppar.',
      'Smält smöret i en stekpanna på medelvärme.',
      'Häll i smeten. När den börjar stelna, dra kanterna inåt så okokt smet rinner ut.',
      'När toppen nästan stelnat, strö över skinka och ost på ena halvan.',
      'Vik omeletten och låt osten smälta 1 min. Servera direkt.',
    ],
  },
  {
    id: 'r39',
    name: 'Quesadillas med kyckling',
    portions: 4,
    time: 20,
    categories: ['snabb', 'kyckling'],
    ingredients: [
      { name: 'Tortillabröd', amount: 8, unit: 'st' },
      { name: 'Kycklingfilé', amount: 400, unit: 'g' },
      { name: 'Riven ost', amount: 250, unit: 'g' },
      { name: 'Röd paprika', amount: 1, unit: 'st' },
      { name: 'Rödlök', amount: 1, unit: 'st' },
      { name: 'Crème fraiche', amount: 2, unit: 'dl' },
      { name: 'Salsa', amount: 1, unit: 'burk' },
      { name: 'Tacokrydda', amount: 2, unit: 'msk' },
    ],
    steps: [
      'Skär kycklingen i strimlor. Krydda med tacokrydda.',
      'Stek kycklingen i olja tills genomstekt. Ta upp.',
      'Strimla paprika och rödlök tunt.',
      'Lägg en tortilla i torr panna. Toppa halvan med ost, kyckling, paprika och lök. Vik över.',
      'Stek gyllene ca 2 min per sida tills osten smält.',
      'Skär i klyftor. Servera med crème fraiche och salsa.',
    ],
  },

  // ===== Svenska klassiker =====
  {
    id: 'r40',
    name: 'Kåldolmar med gräddsås',
    portions: 4,
    time: 90,
    categories: ['kott', 'gryta'],
    ingredients: [
      { name: 'Vitkål', amount: 1, unit: 'st' },
      { name: 'Blandfärs', amount: 500, unit: 'g' },
      { name: 'Ris', amount: 1, unit: 'dl' },
      { name: 'Gul lök', amount: 1, unit: 'st' },
      { name: 'Ägg', amount: 1, unit: 'st' },
      { name: 'Mjölk', amount: 1, unit: 'dl' },
      { name: 'Sirap', amount: 2, unit: 'msk' },
      { name: 'Smör', amount: 50, unit: 'g' },
      { name: 'Vispgrädde', amount: 2, unit: 'dl' },
      { name: 'Köttbuljongtärning', amount: 1, unit: 'st' },
      { name: 'Vetemjöl', amount: 1, unit: 'msk' },
      { name: 'Potatis', amount: 1, unit: 'kg' },
      { name: 'Lingonsylt', amount: 1, unit: 'burk' },
    ],
    steps: [
      'Sätt ugnen på 200°C. Koka riset enligt paketet.',
      'Skär bort stocken från kålhuvudet. Koka hela huvudet i saltat vatten 10 min, plocka av bladen efter hand.',
      'Hacka löken fint. Blanda färs, ris, lök, ägg, mjölk, salt och peppar.',
      'Lägg en klick fyllning på varje kålblad och rulla ihop.',
      'Lägg rullarna i smord ugnsform. Pensla med sirap och klicka smör över.',
      'Grädda 30-40 min tills gyllenbruna. Baka potatisen samtidigt.',
      'Sila skyn från formen till en kastrull. Red med mjöl utrört i grädde, koka upp med buljong. Salta och peppra.',
      'Servera kåldolmar med potatis, sås och lingon.',
    ],
  },
  {
    id: 'r41',
    name: 'Ärtsoppa med pannkakor',
    portions: 4,
    time: 60,
    categories: ['soppa'],
    ingredients: [
      { name: 'Gula ärtor', amount: 4, unit: 'dl' },
      { name: 'Rimmat fläsk', amount: 300, unit: 'g' },
      { name: 'Gul lök', amount: 1, unit: 'st' },
      { name: 'Timjan', amount: 1, unit: 'tsk' },
      { name: 'Senap', amount: 2, unit: 'msk' },
      { name: 'Vetemjöl', amount: 3, unit: 'dl' },
      { name: 'Mjölk', amount: 6, unit: 'dl' },
      { name: 'Ägg', amount: 3, unit: 'st' },
      { name: 'Smör', amount: 50, unit: 'g' },
      { name: 'Salt', amount: 1, unit: 'krm' },
      { name: 'Sylt', amount: 1, unit: 'burk' },
    ],
    steps: [
      'Skölj ärtorna och lägg dem i blöt över natten. Alternativt: använd konserverade ärtor och hoppa direkt till steg 3.',
      'Koka ärtorna i vatten 45-60 min tills mjuka. Skumma av.',
      'Tillsätt hackad lök, timjan och fläsket. Låt sjuda 30 min till.',
      'Ta upp fläsket, skär i skivor. Smaka av soppan med salt.',
      'Pannkakor: vispa ihop mjöl, salt, hälften av mjölken. Tillsätt äggen och resten av mjölken.',
      'Stek pannkakor i smör i het panna.',
      'Servera soppan med senap och fläsk, pannkakor med sylt till efterrätt.',
    ],
  },
  {
    id: 'r42',
    name: 'Pytt i panna med stekt ägg',
    portions: 4,
    time: 30,
    categories: ['kott', 'snabb'],
    ingredients: [
      { name: 'Potatis', amount: 800, unit: 'g' },
      { name: 'Rökt skinka', amount: 300, unit: 'g' },
      { name: 'Falukorv', amount: 300, unit: 'g' },
      { name: 'Gul lök', amount: 2, unit: 'st' },
      { name: 'Smör', amount: 3, unit: 'msk' },
      { name: 'Ägg', amount: 4, unit: 'st' },
      { name: 'Inlagda rödbetor', amount: 1, unit: 'burk' },
      { name: 'Salt', amount: 1, unit: 'krm' },
      { name: 'Svartpeppar', amount: 1, unit: 'krm' },
    ],
    steps: [
      'Skala potatisen och skär i små tärningar. Hacka löken.',
      'Skär skinka och falukorv i lika stora tärningar.',
      'Stek potatisen gyllenbrun i smör på medelvärme, ca 15 min. Salta.',
      'Lägg i löken och stek 3 min till.',
      'Tillsätt skinka och falukorv. Bryn ytterligare 5 min.',
      'Stek äggen med rinnig gula i en annan panna.',
      'Servera pytten med stekt ägg och inlagda rödbetor.',
    ],
  },
  {
    id: 'r43',
    name: 'Raggmunk med fläsk och lingon',
    portions: 4,
    time: 35,
    categories: ['kott', 'snabb'],
    ingredients: [
      { name: 'Potatis', amount: 1, unit: 'kg' },
      { name: 'Vetemjöl', amount: 2, unit: 'dl' },
      { name: 'Mjölk', amount: 3, unit: 'dl' },
      { name: 'Ägg', amount: 2, unit: 'st' },
      { name: 'Rökt sidfläsk', amount: 300, unit: 'g' },
      { name: 'Smör', amount: 50, unit: 'g' },
      { name: 'Salt', amount: 1, unit: 'krm' },
      { name: 'Lingonsylt', amount: 1, unit: 'burk' },
    ],
    steps: [
      'Skär sidfläsket i skivor och stek knaprigt i stekpanna. Håll varmt.',
      'Vispa ihop mjöl, mjölk, ägg och salt till en slät smet.',
      'Skala och riv potatisen grovt. Rör snabbt ner den i smeten.',
      'Stek raggmunkar i smör i het panna, ca 2-3 min per sida tills gyllenbruna.',
      'Servera med fläsket och lingonsylt.',
    ],
  },
  {
    id: 'r44',
    name: 'Isterband med stuvade makaroner',
    portions: 4,
    time: 30,
    categories: ['kott', 'pasta'],
    ingredients: [
      { name: 'Isterband', amount: 8, unit: 'st' },
      { name: 'Makaroner', amount: 400, unit: 'g' },
      { name: 'Smör', amount: 50, unit: 'g' },
      { name: 'Vetemjöl', amount: 3, unit: 'msk' },
      { name: 'Mjölk', amount: 6, unit: 'dl' },
      { name: 'Färsk persilja', amount: 1, unit: 'kruka' },
      { name: 'Senap', amount: 2, unit: 'msk' },
      { name: 'Salt', amount: 1, unit: 'krm' },
      { name: 'Svartpeppar', amount: 1, unit: 'krm' },
    ],
    steps: [
      'Koka makaronerna al dente enligt paketet. Häll av.',
      'Stek isterbanden gyllene i lite olja på medelvärme, ca 8 min. Vänd några gånger.',
      'Smält smöret i en kastrull. Rör i mjölet. Vispa i mjölken lite i taget.',
      'Låt såsen sjuda 5 min. Salta och peppra.',
      'Blanda ner makaronerna i såsen. Rör i hackad persilja.',
      'Servera med isterbanden och senap.',
    ],
  },
  {
    id: 'r45',
    name: 'Wallenbergare med potatismos',
    portions: 4,
    time: 45,
    categories: ['kott'],
    ingredients: [
      { name: 'Kalvfärs', amount: 600, unit: 'g' },
      { name: 'Äggula', amount: 4, unit: 'st' },
      { name: 'Vispgrädde', amount: 3, unit: 'dl' },
      { name: 'Ströbröd', amount: 2, unit: 'dl' },
      { name: 'Smör', amount: 100, unit: 'g' },
      { name: 'Potatis', amount: 1, unit: 'kg' },
      { name: 'Mjölk', amount: 1, unit: 'dl' },
      { name: 'Ärtor', amount: 300, unit: 'g' },
      { name: 'Lingonsylt', amount: 1, unit: 'burk' },
      { name: 'Salt', amount: 1, unit: 'tsk' },
      { name: 'Vitpeppar', amount: 1, unit: 'krm' },
    ],
    steps: [
      'Skala och koka potatisen i saltat vatten.',
      'Rör ihop kalvfärs, äggulor, salt och vitpeppar. Vispa försiktigt i grädden lite i taget.',
      'Forma 8 platta biffar. Vänd dem i ströbröd.',
      'Stek Wallenbergarna i rikligt med smör på medelvärme, ca 4 min per sida.',
      'Mosa potatisen med varm mjölk och en klick smör. Salta.',
      'Värm ärtorna.',
      'Servera Wallenbergare med potatismos, gröna ärtor och lingonsylt.',
    ],
  },

  // ===== Italienskt =====
  {
    id: 'r46',
    name: 'Pizza margherita',
    portions: 4,
    time: 90,
    categories: ['ugn', 'veg'],
    ingredients: [
      { name: 'Vetemjöl special', amount: 6, unit: 'dl' },
      { name: 'Torrjäst', amount: 1, unit: 'paket' },
      { name: 'Ljummet vatten', amount: 3, unit: 'dl' },
      { name: 'Olivolja', amount: 2, unit: 'msk' },
      { name: 'Salt', amount: 1, unit: 'tsk' },
      { name: 'Krossade tomater', amount: 1, unit: 'burk' },
      { name: 'Vitlöksklyfta', amount: 2, unit: 'st' },
      { name: 'Oregano', amount: 1, unit: 'tsk' },
      { name: 'Mozzarella', amount: 2, unit: 'paket' },
      { name: 'Färsk basilika', amount: 1, unit: 'kruka' },
    ],
    steps: [
      'Blanda vatten, jäst, salt och olivolja. Rör i mjölet till en smidig deg. Jäs 45 min under duk.',
      'Sätt ugnen på maxtemperatur (250°C+) med plåt inne.',
      'Mixa krossade tomater med pressad vitlök, oregano, salt och lite olivolja.',
      'Dela degen i 4 delar. Kavla ut varje del tunt.',
      'Bred på tomatsås och toppa med sönderriven mozzarella.',
      'Grädda på het plåt ca 8-10 min tills botten är knaprig.',
      'Toppa med färska basilikablad och en skvätt olivolja före servering.',
    ],
  },
  {
    id: 'r47',
    name: 'Risotto med champinjoner',
    portions: 4,
    time: 40,
    categories: ['veg'],
    ingredients: [
      { name: 'Risottoris', amount: 4, unit: 'dl' },
      { name: 'Champinjoner', amount: 400, unit: 'g' },
      { name: 'Grönsaksbuljong', amount: 1, unit: 'l' },
      { name: 'Vitt vin', amount: 2, unit: 'dl' },
      { name: 'Gul lök', amount: 1, unit: 'st' },
      { name: 'Vitlöksklyfta', amount: 2, unit: 'st' },
      { name: 'Smör', amount: 75, unit: 'g' },
      { name: 'Parmesan', amount: 100, unit: 'g' },
      { name: 'Färsk timjan', amount: 1, unit: 'kruka' },
      { name: 'Olivolja', amount: 2, unit: 'msk' },
    ],
    steps: [
      'Håll buljongen varm i en kastrull.',
      'Skiva champinjonerna och stek dem gyllenbruna i olja. Salta och krydda med timjan. Ta upp.',
      'Hacka löken och pressa vitlöken. Fräs mjukt i olja i en tjockbottnad gryta.',
      'Rör i riset så det blir glansigt. Häll på vinet och låt koka in.',
      'Tillsätt varm buljong en slev i taget under omrörning. Vänta tills vätskan koks in innan mer tillsätts.',
      'Efter ca 20 min ska riset vara krämigt men med lite bett kvar.',
      'Rör ner smör, riven parmesan och champinjonerna. Smaka av med salt och peppar.',
    ],
  },
  {
    id: 'r48',
    name: 'Räkrisotto med citron',
    portions: 4,
    time: 40,
    categories: ['fisk'],
    ingredients: [
      { name: 'Risottoris', amount: 4, unit: 'dl' },
      { name: 'Räkor', amount: 400, unit: 'g' },
      { name: 'Fiskbuljong', amount: 1, unit: 'l' },
      { name: 'Vitt vin', amount: 2, unit: 'dl' },
      { name: 'Gul lök', amount: 1, unit: 'st' },
      { name: 'Vitlöksklyfta', amount: 2, unit: 'st' },
      { name: 'Smör', amount: 75, unit: 'g' },
      { name: 'Parmesan', amount: 50, unit: 'g' },
      { name: 'Citron', amount: 1, unit: 'st' },
      { name: 'Färsk persilja', amount: 1, unit: 'kruka' },
    ],
    steps: [
      'Håll fiskbuljongen varm.',
      'Skala räkorna. Spara några hela till toppen.',
      'Fräs hackad lök och vitlök i smör tills mjuk.',
      'Rör i riset så det blir glansigt. Häll på vinet och låt koka in.',
      'Tillsätt varm buljong en slev i taget under omrörning, ca 18-20 min.',
      'Rör ner räkorna sista 3 min. Blanda i smör, parmesan, citronskal och saft.',
      'Toppa med hackad persilja och hela räkor.',
    ],
  },
  {
    id: 'r49',
    name: 'Gnocchi med gorgonzolasås',
    portions: 4,
    time: 20,
    categories: ['pasta', 'veg', 'snabb'],
    ingredients: [
      { name: 'Färsk gnocchi', amount: 800, unit: 'g' },
      { name: 'Gorgonzola', amount: 200, unit: 'g' },
      { name: 'Vispgrädde', amount: 3, unit: 'dl' },
      { name: 'Valnötter', amount: 75, unit: 'g' },
      { name: 'Färsk salvia', amount: 5, unit: 'st' },
      { name: 'Smör', amount: 25, unit: 'g' },
      { name: 'Parmesan', amount: 30, unit: 'g' },
      { name: 'Svartpeppar', amount: 1, unit: 'krm' },
    ],
    steps: [
      'Koka gnocchin enligt paketet, brukar vara 2-3 min tills de flyter upp.',
      'Rosta valnötterna torr panna tills de doftar.',
      'Smält smöret i en stekpanna. Fräs salviabladen tills de blir knapriga. Ta upp.',
      'Häll i grädden i pannan. Smula ner gorgonzolan. Låt smälta.',
      'Vänd i den avrunna gnocchin. Ringla med olja om det behövs.',
      'Toppa med valnötter, salvia, riven parmesan och svartpeppar.',
    ],
  },
  {
    id: 'r50',
    name: 'Aglio e olio',
    portions: 4,
    time: 15,
    categories: ['pasta', 'veg', 'snabb'],
    ingredients: [
      { name: 'Spaghetti', amount: 400, unit: 'g' },
      { name: 'Vitlöksklyfta', amount: 6, unit: 'st' },
      { name: 'Chiliflakes', amount: 1, unit: 'tsk' },
      { name: 'Olivolja', amount: 1, unit: 'dl' },
      { name: 'Färsk persilja', amount: 1, unit: 'kruka' },
      { name: 'Parmesan', amount: 50, unit: 'g' },
      { name: 'Salt', amount: 1, unit: 'krm' },
      { name: 'Svartpeppar', amount: 1, unit: 'krm' },
    ],
    steps: [
      'Koka spaghettin al dente i välsaltat vatten. Spara 1 dl pastavatten.',
      'Skiva vitlöken tunt.',
      'Värm olivoljan i en stor stekpanna på låg-medelvärme.',
      'Lägg i vitlöken och chiliflakes. Låt fräsa försiktigt tills vitlöken är gyllene men inte bränd.',
      'Blanda i den avrunna pastan och en skvätt pastavatten. Rör runt så oljan täcker.',
      'Toppa med hackad persilja, riven parmesan och grov svartpeppar.',
    ],
  },
  {
    id: 'r51',
    name: 'Lasagne bianco med kyckling',
    portions: 6,
    time: 75,
    categories: ['ugn', 'pasta', 'kyckling'],
    ingredients: [
      { name: 'Kycklingfilé', amount: 600, unit: 'g' },
      { name: 'Lasagneplattor', amount: 1, unit: 'paket' },
      { name: 'Purjolök', amount: 1, unit: 'st' },
      { name: 'Champinjoner', amount: 250, unit: 'g' },
      { name: 'Vitlöksklyfta', amount: 3, unit: 'st' },
      { name: 'Smör', amount: 75, unit: 'g' },
      { name: 'Vetemjöl', amount: 4, unit: 'msk' },
      { name: 'Mjölk', amount: 7, unit: 'dl' },
      { name: 'Vispgrädde', amount: 2, unit: 'dl' },
      { name: 'Riven ost', amount: 250, unit: 'g' },
      { name: 'Färsk timjan', amount: 1, unit: 'kruka' },
      { name: 'Babyspenat', amount: 100, unit: 'g' },
    ],
    steps: [
      'Sätt ugnen på 200°C.',
      'Skär kycklingen i strimlor. Skiva purjolök och champinjoner.',
      'Bryn kycklingen i smör. Tillsätt purjolök, svamp, pressad vitlök och timjan. Fräs 5 min.',
      'Bechamel: smält smör, rör i mjöl, vispa i mjölk och grädde. Låt sjuda 5 min. Krydda.',
      'Blanda hälften av bechamelen med kycklingblandningen och spenaten.',
      'Varva kycklingblandning, lasagneplattor och bechamel i ugnsform. Toppa med bechamel och riven ost.',
      'Grädda 35-40 min tills gyllenbrun. Låt vila 5 min.',
    ],
  },

  // ===== Mexikanskt =====
  {
    id: 'r52',
    name: 'Hemgjorda hamburgare med pommes',
    portions: 4,
    time: 40,
    categories: ['kott', 'snabb'],
    ingredients: [
      { name: 'Nötfärs', amount: 600, unit: 'g' },
      { name: 'Hamburgerbröd', amount: 4, unit: 'st' },
      { name: 'Cheddar', amount: 150, unit: 'g' },
      { name: 'Sallad', amount: 1, unit: 'st' },
      { name: 'Tomat', amount: 2, unit: 'st' },
      { name: 'Rödlök', amount: 1, unit: 'st' },
      { name: 'Ättikagurka', amount: 1, unit: 'burk' },
      { name: 'Ketchup', amount: 1, unit: 'burk' },
      { name: 'Majonnäs', amount: 1, unit: 'dl' },
      { name: 'Senap', amount: 2, unit: 'msk' },
      { name: 'Potatis', amount: 1, unit: 'kg' },
      { name: 'Olivolja', amount: 3, unit: 'msk' },
    ],
    steps: [
      'Sätt ugnen på 225°C. Skär potatisen i klyftor, blanda med olja och salt. Rosta 25-30 min.',
      'Forma nötfärsen till 4 platta biffar. Salta och peppra rikligt.',
      'Skiva tomat och rödlök. Skölj sallad.',
      'Blanda majonnäs och senap till burgardressing.',
      'Stek burgarna i het panna 3-4 min per sida. Lägg på cheddar sista minuten så den smälter.',
      'Rosta bröden lätt i pannan.',
      'Bygg burgarna: bröd, dressing, sallad, biff med ost, tomat, lök, gurka. Servera med klyftpotatisen.',
    ],
  },
  {
    id: 'r53',
    name: 'Fajitas med kyckling',
    portions: 4,
    time: 25,
    categories: ['kyckling', 'snabb'],
    ingredients: [
      { name: 'Kycklingfilé', amount: 600, unit: 'g' },
      { name: 'Röd paprika', amount: 1, unit: 'st' },
      { name: 'Gul paprika', amount: 1, unit: 'st' },
      { name: 'Grön paprika', amount: 1, unit: 'st' },
      { name: 'Rödlök', amount: 1, unit: 'st' },
      { name: 'Vitlöksklyfta', amount: 3, unit: 'st' },
      { name: 'Lime', amount: 1, unit: 'st' },
      { name: 'Spiskummin', amount: 2, unit: 'tsk' },
      { name: 'Paprikapulver', amount: 2, unit: 'tsk' },
      { name: 'Chiliflakes', amount: 1, unit: 'tsk' },
      { name: 'Tortillabröd', amount: 8, unit: 'st' },
      { name: 'Guacamole', amount: 1, unit: 'burk' },
      { name: 'Crème fraiche', amount: 2, unit: 'dl' },
    ],
    steps: [
      'Skär kycklingen i strimlor. Marinera i olja, pressad vitlök, limejuice, kryddor och salt i 10 min.',
      'Strimla paprikorna och rödlöken.',
      'Wokka kycklingen på hög värme i olja tills genomstekt. Ta upp.',
      'Wokka grönsakerna 3-4 min. De ska ha kvar bett.',
      'Lägg tillbaka kycklingen. Blanda väl och smaka av.',
      'Värm tortillabröden.',
      'Servera i tortillabröd med guacamole och crème fraiche.',
    ],
  },
  {
    id: 'r54',
    name: 'Kycklingenchiladas',
    portions: 4,
    time: 50,
    categories: ['kyckling', 'ugn'],
    ingredients: [
      { name: 'Kycklingfilé', amount: 500, unit: 'g' },
      { name: 'Tortillabröd', amount: 8, unit: 'st' },
      { name: 'Krossade tomater', amount: 2, unit: 'burk' },
      { name: 'Gul lök', amount: 1, unit: 'st' },
      { name: 'Vitlöksklyfta', amount: 3, unit: 'st' },
      { name: 'Chipotle-krydda', amount: 2, unit: 'tsk' },
      { name: 'Spiskummin', amount: 1, unit: 'tsk' },
      { name: 'Majs', amount: 1, unit: 'burk' },
      { name: 'Svarta bönor', amount: 1, unit: 'burk' },
      { name: 'Riven ost', amount: 250, unit: 'g' },
      { name: 'Crème fraiche', amount: 2, unit: 'dl' },
      { name: 'Färsk koriander', amount: 1, unit: 'kruka' },
    ],
    steps: [
      'Sätt ugnen på 200°C.',
      'Bryn hackad lök i olja. Tillsätt strimlad kyckling, kryddor och pressad vitlök. Stek genomstekt.',
      'Rör i sköljda bönor och majs. Smaka av med salt.',
      'Enchiladasås: mixa krossade tomater med lite chipotle, salt och vitlök.',
      'Doppa varje tortilla i såsen. Fyll med kycklingblandning och rulla ihop.',
      'Lägg rullarna tätt i ugnsform. Häll över resten av såsen och strö över osten.',
      'Grädda 20-25 min tills bubblande. Servera med crème fraiche och koriander.',
    ],
  },

  // ===== Mellanöstern & Medelhavet =====
  {
    id: 'r55',
    name: 'Falafel med tzatziki',
    portions: 4,
    time: 45,
    categories: ['veg'],
    ingredients: [
      { name: 'Kikärtor', amount: 2, unit: 'burk' },
      { name: 'Gul lök', amount: 1, unit: 'st' },
      { name: 'Vitlöksklyfta', amount: 3, unit: 'st' },
      { name: 'Färsk persilja', amount: 1, unit: 'kruka' },
      { name: 'Spiskummin', amount: 2, unit: 'tsk' },
      { name: 'Koriander malen', amount: 1, unit: 'tsk' },
      { name: 'Vetemjöl', amount: 3, unit: 'msk' },
      { name: 'Turkisk yoghurt', amount: 3, unit: 'dl' },
      { name: 'Gurka', amount: 0.5, unit: 'st' },
      { name: 'Citron', amount: 1, unit: 'st' },
      { name: 'Pitabröd', amount: 4, unit: 'st' },
      { name: 'Salladslök', amount: 1, unit: 'kruka' },
      { name: 'Olja för fritering', amount: 5, unit: 'dl' },
    ],
    steps: [
      'Skölj kikärtorna väl och låt rinna av ordentligt.',
      'Mixa kikärtor, hackad lök, vitlök, persilja, kryddor, mjöl och salt till en grov massa.',
      'Låt smeten stå i kylen 15 min.',
      'Riv gurkan grovt och krama ur. Blanda med yoghurt, pressad vitlök, citronsaft och salt till tzatziki.',
      'Forma smeten till små bollar.',
      'Fritera i het olja (170°C) tills gyllenbruna, ca 3 min. Lägg på hushållspapper.',
      'Värm pitabröden. Servera med falafel, tzatziki, salladslök och citronklyftor.',
    ],
  },
  {
    id: 'r56',
    name: 'Souvlaki med tzatziki',
    portions: 4,
    time: 45,
    categories: ['kott'],
    ingredients: [
      { name: 'Fläskfilé', amount: 700, unit: 'g' },
      { name: 'Olivolja', amount: 1, unit: 'dl' },
      { name: 'Citron', amount: 2, unit: 'st' },
      { name: 'Vitlöksklyfta', amount: 4, unit: 'st' },
      { name: 'Oregano', amount: 2, unit: 'tsk' },
      { name: 'Turkisk yoghurt', amount: 3, unit: 'dl' },
      { name: 'Gurka', amount: 1, unit: 'st' },
      { name: 'Pitabröd', amount: 4, unit: 'st' },
      { name: 'Tomat', amount: 3, unit: 'st' },
      { name: 'Rödlök', amount: 1, unit: 'st' },
      { name: 'Fetaost', amount: 200, unit: 'g' },
    ],
    steps: [
      'Skär fläskfilén i 3 cm kuber. Marinera i olja, citronsaft, pressad vitlök, oregano, salt och peppar 20 min.',
      'Riv gurkan grovt och krama ur. Blanda med yoghurt, 1 pressad vitlöksklyfta och salt till tzatziki.',
      'Trä köttet på spett (blötlagda om trä).',
      'Grilla eller stek spetten 3-4 min per sida tills genomstekta.',
      'Skär tomat och rödlök i skivor. Värm pitabröden.',
      'Servera spett med pita, tzatziki, tomat, rödlök och smulad fetaost.',
    ],
  },
  {
    id: 'r57',
    name: 'Buddha bowl med kikärtor',
    portions: 4,
    time: 40,
    categories: ['veg'],
    ingredients: [
      { name: 'Kikärtor', amount: 2, unit: 'burk' },
      { name: 'Sötpotatis', amount: 2, unit: 'st' },
      { name: 'Quinoa', amount: 3, unit: 'dl' },
      { name: 'Avokado', amount: 2, unit: 'st' },
      { name: 'Grönkål', amount: 100, unit: 'g' },
      { name: 'Rödkål', amount: 200, unit: 'g' },
      { name: 'Morot', amount: 2, unit: 'st' },
      { name: 'Tahini', amount: 3, unit: 'msk' },
      { name: 'Citron', amount: 1, unit: 'st' },
      { name: 'Vitlöksklyfta', amount: 1, unit: 'st' },
      { name: 'Olivolja', amount: 3, unit: 'msk' },
      { name: 'Paprikapulver', amount: 1, unit: 'tsk' },
      { name: 'Spiskummin', amount: 1, unit: 'tsk' },
    ],
    steps: [
      'Sätt ugnen på 225°C. Skär sötpotatis i tärningar, lägg på plåt med olja, salt och paprikapulver.',
      'Skölj kikärtor väl. Blanda med olja, spiskummin och salt. Lägg på annan del av plåten.',
      'Rosta båda 25 min tills gyllenbruna.',
      'Koka quinoa enligt paketet.',
      'Strimla rödkål och grönkål fint. Riv morötterna.',
      'Blanda tahini med citronsaft, pressad vitlök, salt och lite vatten till en krämig dressing.',
      'Lägg upp quinoa i skålar. Arrangera sötpotatis, kikärtor, kål, morot och skivad avokado runt.',
      'Ringla över tahini-dressingen.',
    ],
  },

  // ===== Asiatiskt =====
  {
    id: 'r58',
    name: 'Butter chicken',
    portions: 4,
    time: 45,
    categories: ['kyckling', 'gryta', 'asia'],
    ingredients: [
      { name: 'Kycklingfilé', amount: 700, unit: 'g' },
      { name: 'Turkisk yoghurt', amount: 2, unit: 'dl' },
      { name: 'Garam masala', amount: 2, unit: 'msk' },
      { name: 'Färsk ingefära', amount: 1, unit: 'st' },
      { name: 'Vitlöksklyfta', amount: 4, unit: 'st' },
      { name: 'Krossade tomater', amount: 1, unit: 'burk' },
      { name: 'Vispgrädde', amount: 3, unit: 'dl' },
      { name: 'Smör', amount: 75, unit: 'g' },
      { name: 'Gul lök', amount: 1, unit: 'st' },
      { name: 'Paprikapulver', amount: 2, unit: 'tsk' },
      { name: 'Spiskummin', amount: 1, unit: 'tsk' },
      { name: 'Ris', amount: 4, unit: 'dl' },
      { name: 'Naanbröd', amount: 4, unit: 'st' },
      { name: 'Färsk koriander', amount: 1, unit: 'kruka' },
    ],
    steps: [
      'Skär kycklingen i bitar. Marinera i yoghurt, hälften av garam masalan, riven ingefära och 2 pressade vitlöksklyftor 30 min (helst längre).',
      'Sätt på riset.',
      'Bryn kycklingen i smör tills färgad runt om. Ta upp.',
      'Stek hackad lök mjuk i smör. Tillsätt resten av vitlöken, kryddorna och tomatpuré. Fräs 2 min.',
      'Häll i krossade tomater. Låt sjuda 10 min.',
      'Mixa såsen slät. Häll tillbaka i grytan.',
      'Rör i grädde och smör. Lägg tillbaka kycklingen. Låt sjuda 10 min.',
      'Toppa med koriander. Servera med ris och naan.',
    ],
  },
  {
    id: 'r59',
    name: 'Massaman curry med nötkött',
    portions: 4,
    time: 90,
    categories: ['kott', 'gryta', 'asia'],
    ingredients: [
      { name: 'Högrev', amount: 800, unit: 'g' },
      { name: 'Massaman currypasta', amount: 3, unit: 'msk' },
      { name: 'Kokosmjölk', amount: 2, unit: 'burk' },
      { name: 'Potatis', amount: 500, unit: 'g' },
      { name: 'Gul lök', amount: 1, unit: 'st' },
      { name: 'Jordnötter', amount: 100, unit: 'g' },
      { name: 'Tamarindpasta', amount: 2, unit: 'msk' },
      { name: 'Fisksås', amount: 2, unit: 'msk' },
      { name: 'Palmsocker', amount: 2, unit: 'msk' },
      { name: 'Kanelstång', amount: 1, unit: 'st' },
      { name: 'Ris', amount: 4, unit: 'dl' },
      { name: 'Lime', amount: 1, unit: 'st' },
    ],
    steps: [
      'Skär köttet i stora kuber. Bryn i olja i en gryta. Ta upp.',
      'Fräs currypastan i lite kokosmjölk tills oljan skiljer sig, ca 3 min.',
      'Lägg tillbaka köttet. Häll i resten av kokosmjölken och kanelstången.',
      'Låt sjuda under lock i 1 timme.',
      'Skala och skär potatisen i bitar. Skiva löken. Tillsätt tillsammans med jordnötter, tamarind, fisksås och palmsocker.',
      'Sjud ytterligare 30 min tills köttet är mört och potatisen mjuk.',
      'Sätt på riset.',
      'Smaka av med limejuice. Servera med ris.',
    ],
  },
  {
    id: 'r60',
    name: 'Vietnamesisk pho',
    portions: 4,
    time: 60,
    categories: ['soppa', 'asia'],
    ingredients: [
      { name: 'Nötkött-innanlår', amount: 400, unit: 'g' },
      { name: 'Risnudlar', amount: 250, unit: 'g' },
      { name: 'Kycklingbuljong', amount: 1.5, unit: 'l' },
      { name: 'Färsk ingefära', amount: 1, unit: 'st' },
      { name: 'Kanelstång', amount: 1, unit: 'st' },
      { name: 'Stjärnanis', amount: 3, unit: 'st' },
      { name: 'Salladslök', amount: 1, unit: 'kruka' },
      { name: 'Böngroddar', amount: 200, unit: 'g' },
      { name: 'Färsk koriander', amount: 1, unit: 'kruka' },
      { name: 'Färsk mynta', amount: 1, unit: 'kruka' },
      { name: 'Lime', amount: 2, unit: 'st' },
      { name: 'Fisksås', amount: 3, unit: 'msk' },
      { name: 'Röd chili', amount: 1, unit: 'st' },
    ],
    steps: [
      'Rosta ingefära (halverad, oskalad) och lök torr i panna tills bränd på ytan.',
      'Rosta stjärnanis och kanel torr i 30 sek.',
      'Koka upp buljong med ingefära, lök, kryddor och fisksås. Låt sjuda 30 min. Sila.',
      'Frys köttet 30 min för att kunna skära det så tunt som möjligt.',
      'Blötlägg risnudlarna enligt paketet.',
      'Lägg nudlar och tunt skivat rått kött i skålar.',
      'Häll rykande het buljong över köttet - det tillagas i buljongen.',
      'Servera med böngroddar, örter, chili och limeklyftor att lägga i själva.',
    ],
  },
  {
    id: 'r61',
    name: 'Räk-fried rice',
    portions: 4,
    time: 20,
    categories: ['fisk', 'asia', 'snabb'],
    ingredients: [
      { name: 'Kallt kokt ris', amount: 6, unit: 'dl' },
      { name: 'Räkor', amount: 300, unit: 'g' },
      { name: 'Ägg', amount: 3, unit: 'st' },
      { name: 'Ärtor', amount: 200, unit: 'g' },
      { name: 'Morot', amount: 2, unit: 'st' },
      { name: 'Salladslök', amount: 1, unit: 'kruka' },
      { name: 'Vitlöksklyfta', amount: 3, unit: 'st' },
      { name: 'Färsk ingefära', amount: 1, unit: 'st' },
      { name: 'Soja', amount: 3, unit: 'msk' },
      { name: 'Sesamolja', amount: 1, unit: 'msk' },
    ],
    steps: [
      'Bäst med kokt ris från gårdagen. Om nykokt: bred ut på plåt och kyl 15 min.',
      'Tärna moroten fint. Hacka vitlök och riv ingefäran.',
      'Vispa upp äggen. Wokka i het olja tills fasta. Skär i strimlor.',
      'Wokka räkorna kort, ta upp.',
      'Wokka vitlök, ingefära och morot 2 min. Tillsätt ärtor.',
      'Lägg i riset. Wokka på hög värme så det får lite färg, 3-4 min.',
      'Blanda i räkor, ägg, soja och sesamolja. Toppa med salladslök.',
    ],
  },
  {
    id: 'r62',
    name: 'Bulgogi med ris',
    portions: 4,
    time: 30,
    categories: ['kott', 'asia'],
    ingredients: [
      { name: 'Nötinnanlår tunt skivat', amount: 600, unit: 'g' },
      { name: 'Päron', amount: 1, unit: 'st' },
      { name: 'Soja', amount: 5, unit: 'msk' },
      { name: 'Sesamolja', amount: 2, unit: 'msk' },
      { name: 'Vitlöksklyfta', amount: 4, unit: 'st' },
      { name: 'Färsk ingefära', amount: 1, unit: 'st' },
      { name: 'Farinsocker', amount: 2, unit: 'msk' },
      { name: 'Salladslök', amount: 1, unit: 'kruka' },
      { name: 'Sesamfrön', amount: 2, unit: 'msk' },
      { name: 'Ris', amount: 4, unit: 'dl' },
      { name: 'Kimchi', amount: 1, unit: 'burk' },
    ],
    steps: [
      'Riv päronet fint. Blanda med soja, sesamolja, pressad vitlök, riven ingefära och farinsocker.',
      'Lägg köttet i marinaden och rör om. Låt stå minst 15 min (helst 1 timme).',
      'Sätt på riset.',
      'Wokka köttet i het panna med lite olja tills det är genomstekt och fått lite färg, 3-4 min.',
      'Toppa med skivad salladslök och sesamfrön.',
      'Servera med ris och kimchi.',
    ],
  },
  {
    id: 'r63',
    name: 'Katsu curry med kyckling',
    portions: 4,
    time: 40,
    categories: ['kyckling', 'asia'],
    ingredients: [
      { name: 'Kycklingfilé', amount: 4, unit: 'st' },
      { name: 'Panko-ströbröd', amount: 2, unit: 'dl' },
      { name: 'Ägg', amount: 2, unit: 'st' },
      { name: 'Vetemjöl', amount: 1, unit: 'dl' },
      { name: 'Japansk currypasta', amount: 1, unit: 'paket' },
      { name: 'Gul lök', amount: 1, unit: 'st' },
      { name: 'Morot', amount: 2, unit: 'st' },
      { name: 'Vatten', amount: 5, unit: 'dl' },
      { name: 'Ris', amount: 4, unit: 'dl' },
      { name: 'Olja för stekning', amount: 3, unit: 'dl' },
    ],
    steps: [
      'Sätt på riset.',
      'Currysås: fräs hackad lök och tärnad morot mjuka. Häll i vatten. Låt sjuda 10 min.',
      'Rör ner currypastan (brytt i bitar) och låt smälta. Låt sjuda ytterligare 5 min.',
      'Banka kycklingen platt mellan plastfilm så den är jämntjock.',
      'Panera: mjöl, sedan vispat ägg, sedan panko. Tryck till.',
      'Stek kycklingen i olja på medelvärme tills gyllenbrun och genomstekt, 4-5 min per sida.',
      'Skär kycklingen i skivor. Servera på ris med currysås över.',
    ],
  },
  {
    id: 'r64',
    name: 'Miso ramen med tofu',
    portions: 4,
    time: 25,
    categories: ['soppa', 'asia', 'veg', 'snabb'],
    ingredients: [
      { name: 'Ramen-nudlar', amount: 4, unit: 'paket' },
      { name: 'Tofu', amount: 400, unit: 'g' },
      { name: 'Miso', amount: 4, unit: 'msk' },
      { name: 'Grönsaksbuljong', amount: 1, unit: 'l' },
      { name: 'Vitlöksklyfta', amount: 3, unit: 'st' },
      { name: 'Färsk ingefära', amount: 1, unit: 'st' },
      { name: 'Salladslök', amount: 1, unit: 'kruka' },
      { name: 'Champinjoner', amount: 200, unit: 'g' },
      { name: 'Pak choi', amount: 200, unit: 'g' },
      { name: 'Sojabönor edamame', amount: 200, unit: 'g' },
      { name: 'Sesamolja', amount: 1, unit: 'msk' },
      { name: 'Soja', amount: 3, unit: 'msk' },
    ],
    steps: [
      'Skär tofun i tärningar och stek gyllene i olja med lite soja.',
      'Skiva champinjonerna och stek dem gyllene i sesamolja.',
      'Koka upp buljongen med pressad vitlök och riven ingefära. Rör i misopastan (koka inte).',
      'Koka ramen-nudlarna enligt paketet, separat.',
      'Dela pak choi och lägg i buljongen sista 3 min. Rör ner edamame.',
      'Lägg upp nudlar i skålar. Häll över buljong och grönsaker.',
      'Toppa med tofu, champinjoner och salladslök.',
    ],
  },

  // ===== Fisk =====
  {
    id: 'r65',
    name: 'Panerad fisk med remouladsås',
    portions: 4,
    time: 30,
    categories: ['fisk'],
    ingredients: [
      { name: 'Torskfilé', amount: 600, unit: 'g' },
      { name: 'Panko-ströbröd', amount: 2, unit: 'dl' },
      { name: 'Vetemjöl', amount: 1, unit: 'dl' },
      { name: 'Ägg', amount: 2, unit: 'st' },
      { name: 'Potatis', amount: 1, unit: 'kg' },
      { name: 'Ärtor', amount: 300, unit: 'g' },
      { name: 'Remouladsås', amount: 1, unit: 'burk' },
      { name: 'Citron', amount: 1, unit: 'st' },
      { name: 'Smör', amount: 50, unit: 'g' },
      { name: 'Färsk dill', amount: 1, unit: 'kruka' },
      { name: 'Salt', amount: 1, unit: 'krm' },
    ],
    steps: [
      'Skala potatisen och koka i saltat vatten.',
      'Skär fisken i portionsbitar. Salta.',
      'Panera: mjöl, vispat ägg, panko. Tryck till.',
      'Stek fisken i rikligt med smör på medelvärme, ca 3-4 min per sida tills gyllenbrun.',
      'Värm ärtorna.',
      'Servera med potatis, remouladsås, ärtor, citronklyftor och hackad dill.',
    ],
  },
  {
    id: 'r66',
    name: 'Ugnsbakad kolja med grönsaker',
    portions: 4,
    time: 40,
    categories: ['fisk', 'ugn'],
    ingredients: [
      { name: 'Koljafilé', amount: 600, unit: 'g' },
      { name: 'Färskpotatis', amount: 800, unit: 'g' },
      { name: 'Körsbärstomater', amount: 250, unit: 'g' },
      { name: 'Zucchini', amount: 1, unit: 'st' },
      { name: 'Röd paprika', amount: 1, unit: 'st' },
      { name: 'Rödlök', amount: 1, unit: 'st' },
      { name: 'Vitlöksklyfta', amount: 3, unit: 'st' },
      { name: 'Citron', amount: 1, unit: 'st' },
      { name: 'Olivolja', amount: 4, unit: 'msk' },
      { name: 'Färsk timjan', amount: 1, unit: 'kruka' },
      { name: 'Kalamataoliver', amount: 100, unit: 'g' },
      { name: 'Salt', amount: 1, unit: 'krm' },
    ],
    steps: [
      'Sätt ugnen på 200°C.',
      'Halvera potatisen. Skiva zucchini och paprika. Klyfta rödlöken.',
      'Blanda potatis och grönsaker med olivolja, pressad vitlök, timjan, salt och peppar i en långpanna.',
      'Rosta i ugnen 20 min.',
      'Lägg koljan ovanpå. Runt runt: körsbärstomater och oliver. Ringla över olja och citronskal.',
      'Baka vidare 12-15 min tills fisken är genomstekt.',
      'Servera med citronklyftor.',
    ],
  },
  {
    id: 'r67',
    name: 'Musselsoppa med saffran',
    portions: 4,
    time: 35,
    categories: ['soppa', 'fisk'],
    ingredients: [
      { name: 'Blåmusslor', amount: 2, unit: 'kg' },
      { name: 'Vitt vin', amount: 3, unit: 'dl' },
      { name: 'Vispgrädde', amount: 3, unit: 'dl' },
      { name: 'Fiskbuljong', amount: 5, unit: 'dl' },
      { name: 'Purjolök', amount: 1, unit: 'st' },
      { name: 'Fänkål', amount: 1, unit: 'st' },
      { name: 'Vitlöksklyfta', amount: 3, unit: 'st' },
      { name: 'Saffran', amount: 1, unit: 'paket' },
      { name: 'Färsk persilja', amount: 1, unit: 'kruka' },
      { name: 'Smör', amount: 50, unit: 'g' },
      { name: 'Baguette', amount: 1, unit: 'st' },
    ],
    steps: [
      'Skölj musslorna. Släng de som är trasiga eller inte stänger sig.',
      'Skiva purjolök och fänkål tunt. Fräs mjuka i smör med pressad vitlök i en stor kastrull.',
      'Häll i vinet och låt koka ner till hälften.',
      'Tillsätt fiskbuljong, grädde och saffran. Låt sjuda 5 min.',
      'Lägg i musslorna. Lock på. Ånga 4-5 min tills alla öppnat sig. Släng de som inte öppnat.',
      'Smaka av med salt och peppar. Strö över hackad persilja.',
      'Servera med rostad baguette.',
    ],
  },

  // ===== Fler grytor & kött =====
  {
    id: 'r68',
    name: 'Chorizogryta med kikärtor',
    portions: 4,
    time: 40,
    categories: ['kott', 'gryta'],
    ingredients: [
      { name: 'Chorizo', amount: 400, unit: 'g' },
      { name: 'Kikärtor', amount: 2, unit: 'burk' },
      { name: 'Krossade tomater', amount: 1, unit: 'burk' },
      { name: 'Gul lök', amount: 2, unit: 'st' },
      { name: 'Röd paprika', amount: 1, unit: 'st' },
      { name: 'Vitlöksklyfta', amount: 3, unit: 'st' },
      { name: 'Paprikapulver', amount: 2, unit: 'tsk' },
      { name: 'Spiskummin', amount: 1, unit: 'tsk' },
      { name: 'Babyspenat', amount: 100, unit: 'g' },
      { name: 'Färsk persilja', amount: 1, unit: 'kruka' },
      { name: 'Baguette', amount: 1, unit: 'st' },
    ],
    steps: [
      'Skiva chorizon och stek gyllene i en gryta. Ta upp.',
      'Fräs hackad lök, tärnad paprika och pressad vitlök i chorizofettet.',
      'Rör i kryddorna och fräs 1 min.',
      'Häll i krossade tomater och sköljda kikärtor. Låt sjuda 15 min.',
      'Lägg tillbaka chorizon. Rör ner spenaten sista minuterna.',
      'Toppa med persilja. Servera med bröd.',
    ],
  },
  {
    id: 'r69',
    name: 'Fläskkarré med rotfrukter',
    portions: 4,
    time: 90,
    categories: ['kott', 'ugn'],
    ingredients: [
      { name: 'Fläskkarré', amount: 1, unit: 'kg' },
      { name: 'Potatis', amount: 700, unit: 'g' },
      { name: 'Morot', amount: 4, unit: 'st' },
      { name: 'Palsternacka', amount: 3, unit: 'st' },
      { name: 'Rödlök', amount: 2, unit: 'st' },
      { name: 'Vitlöksklyfta', amount: 4, unit: 'st' },
      { name: 'Olivolja', amount: 4, unit: 'msk' },
      { name: 'Färsk rosmarin', amount: 1, unit: 'kruka' },
      { name: 'Färsk timjan', amount: 1, unit: 'kruka' },
      { name: 'Dijonsenap', amount: 2, unit: 'msk' },
      { name: 'Honung', amount: 2, unit: 'msk' },
      { name: 'Salt', amount: 1, unit: 'tsk' },
    ],
    steps: [
      'Sätt ugnen på 175°C.',
      'Salta och peppra karrén rikligt. Pensla med senap och honung.',
      'Bryn karrén i olja i en gryta så den fått färg runt om.',
      'Skala och skär rotfrukter i klyftor. Klyfta rödlöken.',
      'Lägg karrén i en långpanna. Runt runt: rotfrukter, rödlök, hela vitlöksklyftor och örtkvistar. Ringla över olja.',
      'Baka 60-70 min tills innertemperaturen är 68°C.',
      'Låt köttet vila 10 min under folie innan skivning. Servera med rotfrukterna.',
    ],
  },
  {
    id: 'r70',
    name: 'Bæuf stroganoff',
    portions: 4,
    time: 30,
    categories: ['kott', 'gryta'],
    ingredients: [
      { name: 'Nötinnanlår', amount: 600, unit: 'g' },
      { name: 'Champinjoner', amount: 300, unit: 'g' },
      { name: 'Gul lök', amount: 2, unit: 'st' },
      { name: 'Vispgrädde', amount: 3, unit: 'dl' },
      { name: 'Crème fraiche', amount: 2, unit: 'dl' },
      { name: 'Tomatpuré', amount: 2, unit: 'msk' },
      { name: 'Senap', amount: 1, unit: 'msk' },
      { name: 'Köttbuljongtärning', amount: 1, unit: 'st' },
      { name: 'Ris', amount: 4, unit: 'dl' },
      { name: 'Smör', amount: 2, unit: 'msk' },
      { name: 'Färsk persilja', amount: 1, unit: 'kruka' },
    ],
    steps: [
      'Sätt på riset.',
      'Skär köttet i strimlor. Salta och peppra.',
      'Skiva löken och champinjonerna.',
      'Bryn köttet i het panna i omgångar. Ta upp.',
      'Fräs löken mjuk i smör. Tillsätt svampen och stek tills vätskan avdunstat.',
      'Rör i tomatpuré. Häll i grädde, crème fraiche, senap och smulad buljong.',
      'Lägg tillbaka köttet. Låt sjuda 5 min. Smaka av.',
      'Strö över hackad persilja. Servera med ris.',
    ],
  },
];

export default function App() {
  const [view, setView] = useState('week'); // 'week' | 'recipes' | 'shopping' | 'recipe-detail' | 'recipe-edit'
  const [recipes, setRecipes] = useState([]);
  const [weekPlan, setWeekPlan] = useState({}); // { 0: 'r1', 1: 'r2', ... }
  const [shoppingChecked, setShoppingChecked] = useState({});
  const [extraItems, setExtraItems] = useState([]);
  const [manualIngredients, setManualIngredients] = useState([]); // ingredients added from recipe view
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [showDayPicker, setShowDayPicker] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load from storage
  useEffect(() => {
    (async () => {
      try {
        let savedRecipes = null;
        try {
          const r = await window.storage.get('recipes');
          if (r) savedRecipes = JSON.parse(r.value);
        } catch (e) {}

        if (!savedRecipes || savedRecipes.length === 0) {
          savedRecipes = STARTER_RECIPES;
          await window.storage.set('recipes', JSON.stringify(savedRecipes));
        } else {
          // Migration: ensure all recipes have expected fields
          savedRecipes = savedRecipes.map(r => ({
            ...r,
            categories: r.categories || [],
            steps: r.steps || [],
            time: r.time || 0,
          }));
          // Merge in any new starter recipes the user doesn't have yet (by id)
          const existingIds = new Set(savedRecipes.map(r => r.id));
          const newStarters = STARTER_RECIPES.filter(r => !existingIds.has(r.id));
          // Also upgrade existing starter recipes: if user has a starter recipe with the same id
          // but it lacks steps or time, upgrade it from the latest STARTER_RECIPES data.
          const starterMap = new Map(STARTER_RECIPES.map(r => [r.id, r]));
          savedRecipes = savedRecipes.map(r => {
            const starter = starterMap.get(r.id);
            if (starter && (!r.steps || r.steps.length === 0) && !r.time) {
              // User hasn't customized this starter, upgrade with new fields
              return { ...r, steps: starter.steps || [], time: starter.time || 0 };
            }
            return r;
          });
          if (newStarters.length > 0) {
            savedRecipes = [...savedRecipes, ...newStarters];
          }
          await window.storage.set('recipes', JSON.stringify(savedRecipes));
        }
        setRecipes(savedRecipes);

        try {
          const p = await window.storage.get('weekPlan');
          if (p) setWeekPlan(JSON.parse(p.value));
        } catch (e) {}

        try {
          const c = await window.storage.get('shoppingChecked');
          if (c) setShoppingChecked(JSON.parse(c.value));
        } catch (e) {}

        try {
          const ex = await window.storage.get('extraItems');
          if (ex) setExtraItems(JSON.parse(ex.value));
        } catch (e) {}

        try {
          const mi = await window.storage.get('manualIngredients');
          if (mi) setManualIngredients(JSON.parse(mi.value));
        } catch (e) {}
      } catch (e) {
        console.error('Load error:', e);
        setRecipes(STARTER_RECIPES);
      }
      setLoading(false);
    })();
  }, []);

  const saveRecipes = async (newRecipes) => {
    setRecipes(newRecipes);
    try { await window.storage.set('recipes', JSON.stringify(newRecipes)); } catch (e) {}
  };

  const saveWeekPlan = async (newPlan) => {
    setWeekPlan(newPlan);
    try { await window.storage.set('weekPlan', JSON.stringify(newPlan)); } catch (e) {}
  };

  const saveChecked = async (newChecked) => {
    setShoppingChecked(newChecked);
    try { await window.storage.set('shoppingChecked', JSON.stringify(newChecked)); } catch (e) {}
  };

  const saveExtras = async (newExtras) => {
    setExtraItems(newExtras);
    try { await window.storage.set('extraItems', JSON.stringify(newExtras)); } catch (e) {}
  };

  const saveManualIngredients = async (newMI) => {
    setManualIngredients(newMI);
    try { await window.storage.set('manualIngredients', JSON.stringify(newMI)); } catch (e) {}
  };

  const addIngredientToShopping = (ing) => {
    const newMI = [...manualIngredients];
    const existingIdx = newMI.findIndex(
      m => m.name.toLowerCase() === ing.name.toLowerCase() && m.unit === ing.unit
    );
    if (existingIdx >= 0) {
      newMI[existingIdx] = { ...newMI[existingIdx], amount: newMI[existingIdx].amount + ing.amount };
    } else {
      newMI.push({ name: ing.name, amount: ing.amount, unit: ing.unit });
    }
    saveManualIngredients(newMI);
    // Make sure it shows up unchecked if it was checked before
    const key = `${ing.name.toLowerCase()}__${ing.unit}`;
    if (shoppingChecked[key]) {
      const newChecked = { ...shoppingChecked };
      delete newChecked[key];
      saveChecked(newChecked);
    }
  };

  const assignRecipeToDay = (dayIndex, recipeId) => {
    const newPlan = { ...weekPlan };
    if (recipeId === null) {
      delete newPlan[dayIndex];
    } else {
      newPlan[dayIndex] = recipeId;
    }
    saveWeekPlan(newPlan);
    setShowDayPicker(null);
  };

  const clearWeek = () => {
    if (window.confirm('Vill du rensa hela veckans plan och inköpslistan?')) {
      saveWeekPlan({});
      saveChecked({});
      saveManualIngredients([]);
    }
  };

  // Build shopping list
  const buildShoppingList = () => {
    const items = {};
    Object.values(weekPlan).forEach(recipeId => {
      const recipe = recipes.find(r => r.id === recipeId);
      if (!recipe) return;
      recipe.ingredients.forEach(ing => {
        const key = `${ing.name.toLowerCase()}__${ing.unit}`;
        if (items[key]) {
          items[key].amount += ing.amount;
        } else {
          items[key] = { name: ing.name, amount: ing.amount, unit: ing.unit, key };
        }
      });
    });
    manualIngredients.forEach(ing => {
      const key = `${ing.name.toLowerCase()}__${ing.unit}`;
      if (items[key]) {
        items[key].amount += ing.amount;
      } else {
        items[key] = { name: ing.name, amount: ing.amount, unit: ing.unit, key };
      }
    });
    const list = Object.values(items).sort((a, b) =>
      a.name.localeCompare(b.name, 'sv')
    );
    return list;
  };

  if (loading) {
    return (
      <div style={styles.loadingScreen}>
        <div style={styles.loadingDot} />
      </div>
    );
  }

  return (
    <div style={styles.app}>
      <style>{globalCSS}</style>

      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <h1 style={styles.appTitle}>
            <span style={styles.appTitleAccent}>Vecko</span>meny
          </h1>
          <p style={styles.appSubtitle}>Planera. Handla. Laga.</p>
        </div>
      </header>

      {/* Main content */}
      <main style={styles.main}>
        {view === 'week' && (
          <WeekView
            weekPlan={weekPlan}
            recipes={recipes}
            onPickDay={setShowDayPicker}
            onClearWeek={clearWeek}
            onViewRecipe={(r) => { setSelectedRecipe(r); setView('recipe-detail'); }}
          />
        )}

        {view === 'recipes' && (
          <RecipesView
            recipes={recipes}
            onSelectRecipe={(r) => { setSelectedRecipe(r); setView('recipe-detail'); }}
            onAddRecipe={() => {
              setEditingRecipe({
                id: 'r' + Date.now(),
                name: '',
                portions: 4,
                time: 30,
                categories: [],
                ingredients: [{ name: '', amount: 1, unit: 'st' }],
                steps: [''],
              });
              setView('recipe-edit');
            }}
            onEditRecipe={(r) => {
              setEditingRecipe(JSON.parse(JSON.stringify(r)));
              setView('recipe-edit');
            }}
          />
        )}

        {view === 'shopping' && (
          <ShoppingView
            list={buildShoppingList()}
            checked={shoppingChecked}
            onToggle={(key) => {
              const newChecked = { ...shoppingChecked, [key]: !shoppingChecked[key] };
              saveChecked(newChecked);
            }}
            extras={extraItems}
            onAddExtra={(name) => {
              const newExtras = [...extraItems, { id: 'e' + Date.now(), name, checked: false }];
              saveExtras(newExtras);
            }}
            onToggleExtra={(id) => {
              const newExtras = extraItems.map(e =>
                e.id === id ? { ...e, checked: !e.checked } : e
              );
              saveExtras(newExtras);
            }}
            onRemoveExtra={(id) => {
              saveExtras(extraItems.filter(e => e.id !== id));
            }}
            onClearChecked={() => {
              // Remove manual ingredients whose keys are checked
              const checkedKeys = Object.keys(shoppingChecked).filter(k => shoppingChecked[k]);
              const newMI = manualIngredients.filter(ing => {
                const key = `${ing.name.toLowerCase()}__${ing.unit}`;
                return !checkedKeys.includes(key);
              });
              saveManualIngredients(newMI);
              saveChecked({});
              saveExtras(extraItems.filter(e => !e.checked));
            }}
          />
        )}

        {view === 'recipe-detail' && selectedRecipe && (
          <RecipeDetailView
            recipe={recipes.find(r => r.id === selectedRecipe.id) || selectedRecipe}
            onBack={() => setView('recipes')}
            onAddIngredient={addIngredientToShopping}
            addedKeys={new Set(buildShoppingList().map(i => i.key))}
            onEdit={() => {
              const r = recipes.find(r => r.id === selectedRecipe.id) || selectedRecipe;
              setEditingRecipe(JSON.parse(JSON.stringify(r)));
              setView('recipe-edit');
            }}
            onDelete={() => {
              if (window.confirm(`Ta bort "${selectedRecipe.name}"?`)) {
                saveRecipes(recipes.filter(r => r.id !== selectedRecipe.id));
                // Remove from week plan
                const newPlan = { ...weekPlan };
                Object.keys(newPlan).forEach(k => {
                  if (newPlan[k] === selectedRecipe.id) delete newPlan[k];
                });
                saveWeekPlan(newPlan);
                setView('recipes');
              }
            }}
          />
        )}

        {view === 'recipe-edit' && editingRecipe && (
          <RecipeEditView
            recipe={editingRecipe}
            onChange={setEditingRecipe}
            onSave={() => {
              if (!editingRecipe.name.trim()) {
                alert('Receptet behöver ett namn.');
                return;
              }
              const cleaned = {
                ...editingRecipe,
                name: editingRecipe.name.trim(),
                ingredients: editingRecipe.ingredients.filter(i => i.name.trim()),
              };
              const exists = recipes.find(r => r.id === cleaned.id);
              const newRecipes = exists
                ? recipes.map(r => r.id === cleaned.id ? cleaned : r)
                : [...recipes, cleaned];
              saveRecipes(newRecipes);
              setSelectedRecipe(cleaned);
              setView('recipe-detail');
            }}
            onCancel={() => {
              if (recipes.find(r => r.id === editingRecipe.id)) {
                setView('recipe-detail');
              } else {
                setView('recipes');
              }
            }}
          />
        )}
      </main>

      {/* Bottom nav */}
      {(view === 'week' || view === 'recipes' || view === 'shopping') && (
        <nav style={styles.bottomNav}>
          <button
            onClick={() => setView('week')}
            style={{ ...styles.navBtn, ...(view === 'week' ? styles.navBtnActive : {}) }}
          >
            <Calendar size={22} strokeWidth={view === 'week' ? 2.4 : 1.8} />
            <span style={styles.navLabel}>Vecka</span>
          </button>
          <button
            onClick={() => setView('recipes')}
            style={{ ...styles.navBtn, ...(view === 'recipes' ? styles.navBtnActive : {}) }}
          >
            <ChefHat size={22} strokeWidth={view === 'recipes' ? 2.4 : 1.8} />
            <span style={styles.navLabel}>Recept</span>
          </button>
          <button
            onClick={() => setView('shopping')}
            style={{ ...styles.navBtn, ...(view === 'shopping' ? styles.navBtnActive : {}) }}
          >
            <ShoppingBasket size={22} strokeWidth={view === 'shopping' ? 2.4 : 1.8} />
            <span style={styles.navLabel}>Inköp</span>
          </button>
        </nav>
      )}

      {/* Day picker modal */}
      {showDayPicker !== null && (
        <DayPickerModal
          dayIndex={showDayPicker}
          recipes={recipes}
          currentRecipeId={weekPlan[showDayPicker]}
          onSelect={(recipeId) => assignRecipeToDay(showDayPicker, recipeId)}
          onClose={() => setShowDayPicker(null)}
        />
      )}
    </div>
  );
}

// ============== WEEK VIEW ==============
function WeekView({ weekPlan, recipes, onPickDay, onClearWeek, onViewRecipe }) {
  const plannedCount = Object.keys(weekPlan).length;

  return (
    <div style={styles.viewContainer}>
      <div style={styles.viewHeader}>
        <div>
          <h2 style={styles.viewTitle}>Veckans plan</h2>
          <p style={styles.viewSubtitle}>
            {plannedCount === 0
              ? 'Tryck på en dag för att lägga till en rätt'
              : `${plannedCount} av 7 dagar planerade`}
          </p>
        </div>
        {plannedCount > 0 && (
          <button onClick={onClearWeek} style={styles.linkBtn}>Rensa</button>
        )}
      </div>

      <div style={styles.dayList}>
        {DAYS.map((day, i) => {
          const recipeId = weekPlan[i];
          const recipe = recipes.find(r => r.id === recipeId);
          return (
            <div key={i} style={styles.dayCard}>
              <button
                onClick={() => onPickDay(i)}
                style={styles.dayCardMain}
              >
                <div style={styles.dayLabel}>
                  <span style={styles.dayName}>{day}</span>
                </div>
                {recipe ? (
                  <div style={styles.dayRecipe}>
                    <span style={styles.dayRecipeName}>{recipe.name}</span>
                  </div>
                ) : (
                  <div style={styles.dayEmpty}>
                    <Plus size={16} strokeWidth={2} />
                    <span>Lägg till</span>
                  </div>
                )}
              </button>
              {recipe && (
                <button
                  onClick={() => onViewRecipe(recipe)}
                  style={styles.dayCardSecondary}
                  aria-label="Visa recept"
                >
                  <ChefHat size={18} strokeWidth={1.8} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============== RECIPES VIEW ==============
function RecipesView({ recipes, onSelectRecipe, onAddRecipe }) {
  const [selectedCategory, setSelectedCategory] = useState(null); // null = all categories grid; 'all' = all recipes; 'kott' etc = filter

  // Count recipes per category
  const categoryCounts = {};
  CATEGORIES.forEach(c => {
    categoryCounts[c.id] = recipes.filter(r => (r.categories || []).includes(c.id)).length;
  });
  const uncategorizedCount = recipes.filter(r => !r.categories || r.categories.length === 0).length;

  const filteredRecipes = selectedCategory === 'all'
    ? recipes
    : selectedCategory === 'uncategorized'
      ? recipes.filter(r => !r.categories || r.categories.length === 0)
      : recipes.filter(r => (r.categories || []).includes(selectedCategory));

  // Sort alphabetically
  const sortedRecipes = [...filteredRecipes].sort((a, b) =>
    a.name.localeCompare(b.name, 'sv')
  );

  const currentCategory = CATEGORIES.find(c => c.id === selectedCategory);

  // ===== Show category grid =====
  if (selectedCategory === null) {
    return (
      <div style={styles.viewContainer}>
        <div style={styles.viewHeader}>
          <div>
            <h2 style={styles.viewTitle}>Recept</h2>
            <p style={styles.viewSubtitle}>{recipes.length} sparade · välj kategori</p>
          </div>
          <button onClick={onAddRecipe} style={styles.primaryBtn}>
            <Plus size={18} strokeWidth={2.2} /> Nytt
          </button>
        </div>

        <button
          onClick={() => setSelectedCategory('all')}
          style={styles.allRecipesCard}
        >
          <div style={styles.allRecipesContent}>
            <div style={styles.allRecipesEmoji}>📖</div>
            <div>
              <div style={styles.allRecipesName}>Alla recept</div>
              <div style={styles.allRecipesCount}>{recipes.length} st</div>
            </div>
          </div>
        </button>

        <div style={styles.categoryGrid}>
          {CATEGORIES.map(c => {
            const count = categoryCounts[c.id];
            return (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                style={{
                  ...styles.categoryCard,
                  ...(count === 0 ? styles.categoryCardEmpty : {}),
                }}
                disabled={count === 0}
              >
                <span style={styles.categoryEmoji}>{c.emoji}</span>
                <span style={styles.categoryName}>{c.name}</span>
                <span style={styles.categoryCount}>{count}</span>
              </button>
            );
          })}
        </div>

        {uncategorizedCount > 0 && (
          <button
            onClick={() => setSelectedCategory('uncategorized')}
            style={styles.uncategorizedCard}
          >
            Utan kategori ({uncategorizedCount})
          </button>
        )}
      </div>
    );
  }

  // ===== Show filtered recipe list =====
  return (
    <div style={styles.viewContainer}>
      <button onClick={() => setSelectedCategory(null)} style={styles.backBtn}>
        <ArrowLeft size={18} /> Kategorier
      </button>

      <div style={styles.viewHeader}>
        <div>
          <h2 style={styles.viewTitle}>
            {selectedCategory === 'all' && 'Alla recept'}
            {selectedCategory === 'uncategorized' && 'Utan kategori'}
            {currentCategory && (
              <>
                <span style={styles.titleEmoji}>{currentCategory.emoji}</span>
                {currentCategory.name}
              </>
            )}
          </h2>
          <p style={styles.viewSubtitle}>{sortedRecipes.length} recept</p>
        </div>
        <button onClick={onAddRecipe} style={styles.primaryBtn}>
          <Plus size={18} strokeWidth={2.2} /> Nytt
        </button>
      </div>

      <div style={styles.recipeList}>
        {sortedRecipes.map(r => (
          <button
            key={r.id}
            onClick={() => onSelectRecipe(r)}
            style={styles.recipeCard}
          >
            <div style={styles.recipeCardName}>{r.name}</div>
            <div style={styles.recipeCardMeta}>
              <span>
                {r.ingredients.length} ingredienser · {r.portions} port
                {r.time ? ` · ${r.time} min` : ''}
              </span>
              {r.categories && r.categories.length > 0 && (
                <span style={styles.recipeCardTags}>
                  {r.categories.map(catId => {
                    const cat = CATEGORIES.find(c => c.id === catId);
                    return cat ? (
                      <span key={catId} style={styles.recipeCardTag}>
                        {cat.emoji} {cat.name}
                      </span>
                    ) : null;
                  })}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ============== RECIPE DETAIL ==============
function RecipeDetailView({ recipe, onBack, onEdit, onDelete, onAddIngredient, addedKeys }) {
  const [recentlyAdded, setRecentlyAdded] = useState(null);

  const handleAdd = (ing, idx) => {
    onAddIngredient(ing);
    setRecentlyAdded(idx);
    setTimeout(() => setRecentlyAdded(curr => curr === idx ? null : curr), 1400);
  };

  return (
    <div style={styles.viewContainer}>
      <button onClick={onBack} style={styles.backBtn}>
        <ArrowLeft size={18} /> Tillbaka
      </button>

      <div style={styles.detailHeader}>
        <h2 style={styles.detailTitle}>{recipe.name}</h2>
        <p style={styles.detailMeta}>
          {recipe.portions} portioner
          {recipe.time ? ` · ${recipe.time} min` : ''}
        </p>
      </div>

      <h3 style={styles.sectionTitle}>Ingredienser</h3>
      <p style={styles.detailHint}>Tryck för att lägga till på inköpslistan</p>
      <ul style={styles.ingList}>
        {recipe.ingredients.map((ing, i) => {
          const key = `${ing.name.toLowerCase()}__${ing.unit}`;
          const isOnList = addedKeys.has(key);
          const justAdded = recentlyAdded === i;
          return (
            <li
              key={i}
              onClick={() => handleAdd(ing, i)}
              style={{
                ...styles.ingItem,
                ...styles.ingItemClickable,
                ...(justAdded ? styles.ingItemJustAdded : {}),
              }}
            >
              <div style={styles.ingLeft}>
                <div style={{
                  ...styles.ingIcon,
                  ...(isOnList ? styles.ingIconOnList : {}),
                }}>
                  {justAdded ? <Check size={14} strokeWidth={3} /> : <Plus size={14} strokeWidth={2.2} />}
                </div>
                <span style={styles.ingName}>{ing.name}</span>
              </div>
              <span style={styles.ingAmount}>
                {formatAmount(ing.amount)} {ing.unit}
              </span>
            </li>
          );
        })}
      </ul>

      {recipe.steps && recipe.steps.length > 0 && (
        <>
          <h3 style={styles.sectionTitle}>Så här gör du</h3>
          <ol style={styles.stepList}>
            {recipe.steps.map((step, i) => (
              <li key={i} style={styles.stepItem}>
                <div style={styles.stepNumber}>{i + 1}</div>
                <div style={styles.stepText}>{step}</div>
              </li>
            ))}
          </ol>
        </>
      )}

      <div style={styles.detailActions}>
        <button onClick={onEdit} style={styles.secondaryBtn}>
          <Edit3 size={16} /> Redigera
        </button>
        <button onClick={onDelete} style={styles.dangerBtn}>
          <Trash2 size={16} /> Ta bort
        </button>
      </div>
    </div>
  );
}

// ============== RECIPE EDIT ==============
function RecipeEditView({ recipe, onChange, onSave, onCancel }) {
  const UNITS = ['g', 'kg', 'dl', 'ml', 'l', 'st', 'msk', 'tsk', 'krm', 'kruka', 'burk', 'paket'];

  const updateField = (field, value) => {
    onChange({ ...recipe, [field]: value });
  };

  const updateIngredient = (idx, field, value) => {
    const newIngs = [...recipe.ingredients];
    newIngs[idx] = { ...newIngs[idx], [field]: value };
    onChange({ ...recipe, ingredients: newIngs });
  };

  const addIngredient = () => {
    onChange({
      ...recipe,
      ingredients: [...recipe.ingredients, { name: '', amount: 1, unit: 'st' }],
    });
  };

  const removeIngredient = (idx) => {
    onChange({
      ...recipe,
      ingredients: recipe.ingredients.filter((_, i) => i !== idx),
    });
  };

  const updateStep = (idx, value) => {
    const newSteps = [...(recipe.steps || [])];
    newSteps[idx] = value;
    onChange({ ...recipe, steps: newSteps });
  };

  const addStep = () => {
    onChange({
      ...recipe,
      steps: [...(recipe.steps || []), ''],
    });
  };

  const removeStep = (idx) => {
    onChange({
      ...recipe,
      steps: (recipe.steps || []).filter((_, i) => i !== idx),
    });
  };

  return (
    <div style={styles.viewContainer}>
      <button onClick={onCancel} style={styles.backBtn}>
        <ArrowLeft size={18} /> Avbryt
      </button>

      <div style={styles.detailHeader}>
        <h2 style={styles.detailTitle}>
          {recipe.name ? 'Redigera recept' : 'Nytt recept'}
        </h2>
      </div>

      <label style={styles.label}>Namn</label>
      <input
        type="text"
        value={recipe.name}
        onChange={(e) => updateField('name', e.target.value)}
        placeholder="t.ex. Kycklinggryta med ris"
        style={styles.input}
      />

      <div style={styles.editRow}>
        <div style={{ flex: 1 }}>
          <label style={styles.label}>Portioner</label>
          <div style={styles.portionStepper}>
            <button
              onClick={() => updateField('portions', Math.max(1, recipe.portions - 1))}
              style={styles.stepperBtn}
            >
              <Minus size={16} />
            </button>
            <span style={styles.stepperValue}>{recipe.portions}</span>
            <button
              onClick={() => updateField('portions', recipe.portions + 1)}
              style={styles.stepperBtn}
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <label style={styles.label}>Tid (min)</label>
          <input
            type="number"
            value={recipe.time || ''}
            onChange={(e) => updateField('time', parseInt(e.target.value) || 0)}
            placeholder="30"
            min="0"
            style={{ ...styles.input, marginBottom: 0 }}
          />
        </div>
      </div>

      <label style={styles.label}>Kategorier</label>
      <div style={styles.categoryPickerList}>
        {CATEGORIES.map(c => {
          const isActive = (recipe.categories || []).includes(c.id);
          return (
            <button
              key={c.id}
              onClick={() => {
                const current = recipe.categories || [];
                const next = isActive
                  ? current.filter(id => id !== c.id)
                  : [...current, c.id];
                updateField('categories', next);
              }}
              style={{
                ...styles.categoryPickerChip,
                ...(isActive ? styles.categoryPickerChipActive : {}),
              }}
            >
              <span>{c.emoji}</span>
              <span>{c.name}</span>
            </button>
          );
        })}
      </div>

      <h3 style={styles.sectionTitle}>Ingredienser</h3>
      <div style={styles.ingEditList}>
        {recipe.ingredients.map((ing, i) => (
          <div key={i} style={styles.ingEditRow}>
            <input
              type="text"
              value={ing.name}
              onChange={(e) => updateIngredient(i, 'name', e.target.value)}
              placeholder="Ingrediens"
              style={{ ...styles.input, ...styles.ingNameInput }}
            />
            <input
              type="number"
              value={ing.amount}
              onChange={(e) => updateIngredient(i, 'amount', parseFloat(e.target.value) || 0)}
              step="0.5"
              min="0"
              style={{ ...styles.input, ...styles.ingAmountInput }}
            />
            <select
              value={ing.unit}
              onChange={(e) => updateIngredient(i, 'unit', e.target.value)}
              style={{ ...styles.input, ...styles.ingUnitInput }}
            >
              {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
            <button
              onClick={() => removeIngredient(i)}
              style={styles.removeIngBtn}
              aria-label="Ta bort"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      <button onClick={addIngredient} style={styles.addIngBtn}>
        <Plus size={16} /> Lägg till ingrediens
      </button>

      <h3 style={styles.sectionTitle}>Så här gör du</h3>
      <div style={styles.stepEditList}>
        {(recipe.steps || []).map((step, i) => (
          <div key={i} style={styles.stepEditRow}>
            <div style={styles.stepEditNumber}>{i + 1}</div>
            <textarea
              value={step}
              onChange={(e) => updateStep(i, e.target.value)}
              placeholder="Beskriv steget…"
              rows={2}
              style={{ ...styles.input, ...styles.stepTextarea, marginBottom: 0 }}
            />
            <button
              onClick={() => removeStep(i)}
              style={styles.removeIngBtn}
              aria-label="Ta bort"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      <button onClick={addStep} style={styles.addIngBtn}>
        <Plus size={16} /> Lägg till steg
      </button>

      <div style={styles.detailActions}>
        <button onClick={onSave} style={styles.primaryBtnLarge}>
          <Check size={18} /> Spara
        </button>
      </div>
    </div>
  );
}

// ============== SHOPPING VIEW ==============
function ShoppingView({ list, checked, onToggle, extras, onAddExtra, onToggleExtra, onRemoveExtra, onClearChecked }) {
  const [newItem, setNewItem] = useState('');

  const totalItems = list.length + extras.length;
  const checkedCount = list.filter(i => checked[i.key]).length + extras.filter(e => e.checked).length;

  const handleAdd = () => {
    if (newItem.trim()) {
      onAddExtra(newItem.trim());
      setNewItem('');
    }
  };

  return (
    <div style={styles.viewContainer}>
      <div style={styles.viewHeader}>
        <div>
          <h2 style={styles.viewTitle}>Inköpslista</h2>
          <p style={styles.viewSubtitle}>
            {totalItems === 0
              ? 'Planera veckan så fyller listan på sig'
              : `${checkedCount} av ${totalItems} avbockade`}
          </p>
        </div>
        {checkedCount > 0 && (
          <button onClick={onClearChecked} style={styles.linkBtn}>Rensa avbockade</button>
        )}
      </div>

      {totalItems === 0 ? (
        <div style={styles.emptyState}>
          <ShoppingBasket size={40} strokeWidth={1.2} style={{ opacity: 0.4 }} />
          <p style={styles.emptyText}>Listan är tom</p>
          <p style={styles.emptyHint}>Lägg till rätter under "Vecka" så samlas ingredienserna här.</p>
        </div>
      ) : (
        <ul style={styles.shopList}>
          {list.map(item => {
            const isChecked = checked[item.key];
            return (
              <li
                key={item.key}
                onClick={() => onToggle(item.key)}
                style={{ ...styles.shopItem, ...(isChecked ? styles.shopItemChecked : {}) }}
              >
                <div style={{ ...styles.checkbox, ...(isChecked ? styles.checkboxChecked : {}) }}>
                  {isChecked && <Check size={14} strokeWidth={3} color="#fdfaf3" />}
                </div>
                <span style={{ ...styles.shopName, ...(isChecked ? styles.shopNameChecked : {}) }}>
                  {item.name}
                </span>
                <span style={{ ...styles.shopAmount, ...(isChecked ? styles.shopAmountChecked : {}) }}>
                  {formatAmount(item.amount)} {item.unit}
                </span>
              </li>
            );
          })}
          {extras.map(item => (
            <li
              key={item.id}
              style={{ ...styles.shopItem, ...(item.checked ? styles.shopItemChecked : {}) }}
            >
              <div
                onClick={() => onToggleExtra(item.id)}
                style={{ ...styles.checkbox, ...(item.checked ? styles.checkboxChecked : {}) }}
              >
                {item.checked && <Check size={14} strokeWidth={3} color="#fdfaf3" />}
              </div>
              <span
                onClick={() => onToggleExtra(item.id)}
                style={{ ...styles.shopName, ...(item.checked ? styles.shopNameChecked : {}), flex: 1 }}
              >
                {item.name}
                <span style={styles.extraBadge}>egen</span>
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); onRemoveExtra(item.id); }}
                style={styles.removeExtraBtn}
                aria-label="Ta bort"
              >
                <X size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div style={styles.addItemRow}>
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Lägg till extra vara…"
          style={{ ...styles.input, flex: 1, marginBottom: 0 }}
        />
        <button onClick={handleAdd} style={styles.addBtn} aria-label="Lägg till">
          <Plus size={20} strokeWidth={2.2} />
        </button>
      </div>
    </div>
  );
}

// ============== DAY PICKER MODAL ==============
function DayPickerModal({ dayIndex, recipes, currentRecipeId, onSelect, onClose }) {
  return (
    <div style={styles.modalBackdrop} onClick={onClose}>
      <div style={styles.modalSheet} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}>{DAYS[dayIndex]}</h3>
          <button onClick={onClose} style={styles.modalClose} aria-label="Stäng">
            <X size={20} />
          </button>
        </div>

        <p style={styles.modalSubtitle}>Välj rätt för dagen</p>

        <div style={styles.modalList}>
          {currentRecipeId && (
            <button
              onClick={() => onSelect(null)}
              style={styles.modalItemDanger}
            >
              <Trash2 size={16} />
              Ta bort från dagen
            </button>
          )}
          {recipes.map(r => (
            <button
              key={r.id}
              onClick={() => onSelect(r.id)}
              style={{
                ...styles.modalItem,
                ...(currentRecipeId === r.id ? styles.modalItemActive : {}),
              }}
            >
              <span style={styles.modalItemName}>{r.name}</span>
              {currentRecipeId === r.id && <Check size={18} strokeWidth={2.4} />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============== HELPERS ==============
function formatAmount(n) {
  if (n === Math.floor(n)) return n.toString();
  return n.toFixed(1).replace('.', ',');
}

// ============== STYLES ==============
const colors = {
  bg: '#fdfaf3',
  bgAlt: '#f5f0e5',
  ink: '#2a2520',
  inkSoft: '#6b6258',
  inkMuted: '#9a9189',
  accent: '#c2410c', // warm terracotta
  accentSoft: '#fed7aa',
  line: '#e8dfd0',
  white: '#ffffff',
  danger: '#991b1b',
  success: '#15803d',
};

const globalCSS = `
  * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
  body { margin: 0; }
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter+Tight:wght@400;500;600;700&display=swap');
  button { font-family: inherit; cursor: pointer; }
  input, select { font-family: inherit; }
  input:focus, select:focus { outline: none; border-color: ${colors.accent}; }
  input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
  ::selection { background: ${colors.accentSoft}; color: ${colors.ink}; }
`;

const styles = {
  app: {
    minHeight: '100vh',
    background: colors.bg,
    fontFamily: "'Inter Tight', system-ui, sans-serif",
    color: colors.ink,
    paddingBottom: 80,
    maxWidth: 540,
    margin: '0 auto',
    position: 'relative',
  },
  loadingScreen: {
    minHeight: '100vh',
    background: colors.bg,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingDot: {
    width: 12,
    height: 12,
    borderRadius: '50%',
    background: colors.accent,
    animation: 'pulse 1.2s ease-in-out infinite',
  },
  header: {
    padding: '32px 24px 20px',
    borderBottom: `1px solid ${colors.line}`,
  },
  headerInner: {},
  appTitle: {
    fontFamily: "'Fraunces', Georgia, serif",
    fontSize: 32,
    fontWeight: 600,
    margin: 0,
    letterSpacing: '-0.02em',
    color: colors.ink,
  },
  appTitleAccent: {
    color: colors.accent,
    fontStyle: 'italic',
  },
  appSubtitle: {
    fontSize: 13,
    color: colors.inkMuted,
    margin: '4px 0 0',
    letterSpacing: '0.02em',
    textTransform: 'uppercase',
    fontWeight: 500,
  },
  main: {
    padding: '0 0 24px',
  },
  viewContainer: {
    padding: '24px 20px',
  },
  viewHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 20,
  },
  viewTitle: {
    fontFamily: "'Fraunces', serif",
    fontSize: 24,
    fontWeight: 600,
    margin: 0,
    letterSpacing: '-0.01em',
  },
  viewSubtitle: {
    fontSize: 13,
    color: colors.inkMuted,
    margin: '2px 0 0',
  },
  linkBtn: {
    background: 'transparent',
    border: 'none',
    color: colors.accent,
    fontSize: 13,
    fontWeight: 600,
    padding: '6px 4px',
  },
  primaryBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    background: colors.ink,
    color: colors.bg,
    border: 'none',
    padding: '10px 14px',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
  },
  primaryBtnLarge: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    background: colors.ink,
    color: colors.bg,
    border: 'none',
    padding: '14px 20px',
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 600,
    flex: 1,
  },
  secondaryBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    background: colors.white,
    color: colors.ink,
    border: `1px solid ${colors.line}`,
    padding: '12px 16px',
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 500,
    flex: 1,
  },
  dangerBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    background: 'transparent',
    color: colors.danger,
    border: `1px solid ${colors.line}`,
    padding: '12px 16px',
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 500,
  },
  backBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    background: 'transparent',
    color: colors.inkSoft,
    border: 'none',
    padding: '6px 0',
    fontSize: 14,
    fontWeight: 500,
    marginBottom: 12,
  },
  // Day list
  dayList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  dayCard: {
    display: 'flex',
    background: colors.white,
    border: `1px solid ${colors.line}`,
    borderRadius: 14,
    overflow: 'hidden',
    transition: 'all 0.15s',
  },
  dayCardMain: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: '16px 18px',
    background: 'transparent',
    border: 'none',
    textAlign: 'left',
    minHeight: 64,
  },
  dayCardSecondary: {
    background: 'transparent',
    border: 'none',
    borderLeft: `1px solid ${colors.line}`,
    padding: '0 18px',
    color: colors.inkSoft,
    display: 'flex',
    alignItems: 'center',
  },
  dayLabel: {
    minWidth: 72,
  },
  dayName: {
    fontFamily: "'Fraunces', serif",
    fontSize: 16,
    fontWeight: 500,
    color: colors.ink,
  },
  dayRecipe: {
    flex: 1,
  },
  dayRecipeName: {
    fontSize: 15,
    color: colors.ink,
    fontWeight: 500,
  },
  dayEmpty: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    color: colors.inkMuted,
    fontSize: 14,
  },
  // Recipe list
  recipeList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  recipeCard: {
    background: colors.white,
    border: `1px solid ${colors.line}`,
    borderRadius: 14,
    padding: '16px 18px',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'all 0.15s',
    width: '100%',
    fontFamily: 'inherit',
  },
  recipeCardName: {
    fontFamily: "'Fraunces', serif",
    fontSize: 17,
    fontWeight: 500,
    color: colors.ink,
    marginBottom: 4,
  },
  recipeCardMeta: {
    fontSize: 13,
    color: colors.inkMuted,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  recipeCardTags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 2,
  },
  recipeCardTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 3,
    fontSize: 11,
    fontWeight: 500,
    color: colors.inkSoft,
    background: colors.bgAlt,
    padding: '3px 7px',
    borderRadius: 6,
  },
  titleEmoji: {
    marginRight: 8,
    fontSize: '0.9em',
  },
  // Category grid
  allRecipesCard: {
    width: '100%',
    background: colors.ink,
    color: colors.bg,
    border: 'none',
    borderRadius: 14,
    padding: '18px 20px',
    marginBottom: 14,
    textAlign: 'left',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  allRecipesContent: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
  },
  allRecipesEmoji: {
    fontSize: 28,
  },
  allRecipesName: {
    fontFamily: "'Fraunces', serif",
    fontSize: 18,
    fontWeight: 600,
    marginBottom: 2,
  },
  allRecipesCount: {
    fontSize: 13,
    opacity: 0.7,
  },
  categoryGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
  },
  categoryCard: {
    background: colors.white,
    border: `1px solid ${colors.line}`,
    borderRadius: 14,
    padding: '18px 14px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 6,
    transition: 'all 0.15s',
    fontFamily: 'inherit',
    minHeight: 96,
    justifyContent: 'space-between',
  },
  categoryCardEmpty: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
  categoryEmoji: {
    fontSize: 24,
    lineHeight: 1,
  },
  categoryName: {
    fontFamily: "'Fraunces', serif",
    fontSize: 15,
    fontWeight: 500,
    color: colors.ink,
  },
  categoryCount: {
    fontSize: 11,
    color: colors.inkMuted,
    fontWeight: 600,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },
  uncategorizedCard: {
    width: '100%',
    background: 'transparent',
    border: `1px dashed ${colors.line}`,
    borderRadius: 12,
    padding: '12px 16px',
    marginTop: 12,
    color: colors.inkSoft,
    fontSize: 13,
    fontFamily: 'inherit',
    cursor: 'pointer',
  },
  // Category picker (in edit view)
  categoryPickerList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  categoryPickerChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    background: colors.white,
    border: `1px solid ${colors.line}`,
    borderRadius: 20,
    padding: '7px 12px',
    fontSize: 13,
    color: colors.inkSoft,
    fontFamily: 'inherit',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  categoryPickerChipActive: {
    background: colors.accentSoft,
    borderColor: colors.accent,
    color: colors.ink,
    fontWeight: 600,
  },
  // Detail
  detailHeader: {
    marginBottom: 24,
  },
  detailTitle: {
    fontFamily: "'Fraunces', serif",
    fontSize: 28,
    fontWeight: 600,
    margin: 0,
    letterSpacing: '-0.015em',
    lineHeight: 1.15,
  },
  detailMeta: {
    fontSize: 13,
    color: colors.inkMuted,
    margin: '6px 0 0',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    fontWeight: 500,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: colors.inkSoft,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    margin: '24px 0 12px',
  },
  ingList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    background: colors.white,
    border: `1px solid ${colors.line}`,
    borderRadius: 14,
    overflow: 'hidden',
  },
  ingItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    borderBottom: `1px solid ${colors.line}`,
    fontSize: 15,
  },
  ingItemClickable: {
    cursor: 'pointer',
    transition: 'background 0.15s',
    WebkitTapHighlightColor: 'transparent',
  },
  ingItemJustAdded: {
    background: colors.accentSoft,
  },
  ingLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  ingIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    border: `1.5px solid ${colors.line}`,
    background: colors.white,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    color: colors.inkSoft,
    transition: 'all 0.2s',
  },
  ingIconOnList: {
    background: colors.accent,
    borderColor: colors.accent,
    color: colors.bg,
  },
  detailHint: {
    fontSize: 12,
    color: colors.inkMuted,
    margin: '-8px 0 12px',
    fontStyle: 'italic',
  },
  // Steps display
  stepList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  stepItem: {
    display: 'flex',
    gap: 14,
    padding: '14px 16px',
    background: colors.white,
    border: `1px solid ${colors.line}`,
    borderRadius: 14,
    fontSize: 15,
    lineHeight: 1.5,
    color: colors.ink,
  },
  stepNumber: {
    flexShrink: 0,
    width: 28,
    height: 28,
    borderRadius: '50%',
    background: colors.accentSoft,
    color: colors.accent,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Fraunces', serif",
    fontSize: 15,
    fontWeight: 600,
  },
  stepText: {
    flex: 1,
    paddingTop: 3,
  },
  // Step editing
  stepEditList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    marginBottom: 12,
  },
  stepEditRow: {
    display: 'flex',
    gap: 8,
    alignItems: 'flex-start',
  },
  stepEditNumber: {
    flexShrink: 0,
    width: 28,
    height: 28,
    borderRadius: '50%',
    background: colors.accentSoft,
    color: colors.accent,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Fraunces', serif",
    fontSize: 14,
    fontWeight: 600,
    marginTop: 8,
  },
  stepTextarea: {
    flex: 1,
    resize: 'vertical',
    fontFamily: 'inherit',
    lineHeight: 1.5,
    minHeight: 60,
  },
  editRow: {
    display: 'flex',
    gap: 12,
    alignItems: 'flex-end',
  },
  ingName: {
    color: colors.ink,
  },
  ingAmount: {
    color: colors.inkSoft,
    fontVariantNumeric: 'tabular-nums',
    fontSize: 14,
    fontWeight: 500,
  },
  detailActions: {
    display: 'flex',
    gap: 8,
    marginTop: 24,
  },
  // Edit form
  label: {
    display: 'block',
    fontSize: 12,
    fontWeight: 600,
    color: colors.inkSoft,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginTop: 16,
    marginBottom: 6,
  },
  input: {
    width: '100%',
    padding: '11px 14px',
    border: `1px solid ${colors.line}`,
    background: colors.white,
    borderRadius: 10,
    fontSize: 15,
    color: colors.ink,
    transition: 'border-color 0.15s',
    marginBottom: 4,
  },
  portionStepper: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 0,
    background: colors.white,
    border: `1px solid ${colors.line}`,
    borderRadius: 10,
    overflow: 'hidden',
  },
  stepperBtn: {
    background: 'transparent',
    border: 'none',
    padding: '10px 14px',
    color: colors.ink,
    display: 'flex',
  },
  stepperValue: {
    minWidth: 36,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: 600,
    fontVariantNumeric: 'tabular-nums',
  },
  ingEditList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    marginBottom: 12,
  },
  ingEditRow: {
    display: 'flex',
    gap: 6,
    alignItems: 'center',
  },
  ingNameInput: {
    flex: 2,
    marginBottom: 0,
  },
  ingAmountInput: {
    width: 64,
    marginBottom: 0,
    textAlign: 'center',
  },
  ingUnitInput: {
    width: 76,
    marginBottom: 0,
    padding: '11px 8px',
  },
  removeIngBtn: {
    background: 'transparent',
    border: 'none',
    color: colors.inkMuted,
    padding: 8,
    display: 'flex',
  },
  addIngBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    background: 'transparent',
    color: colors.accent,
    border: `1px dashed ${colors.line}`,
    padding: '10px 14px',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 500,
    width: '100%',
    justifyContent: 'center',
  },
  // Shopping
  shopList: {
    listStyle: 'none',
    padding: 0,
    margin: '0 0 20px',
    background: colors.white,
    border: `1px solid ${colors.line}`,
    borderRadius: 14,
    overflow: 'hidden',
  },
  shopItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '14px 16px',
    borderBottom: `1px solid ${colors.line}`,
    cursor: 'pointer',
    fontSize: 15,
    transition: 'background 0.1s',
  },
  shopItemChecked: {
    background: colors.bgAlt,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    border: `1.5px solid ${colors.line}`,
    background: colors.white,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'all 0.15s',
  },
  checkboxChecked: {
    background: colors.accent,
    borderColor: colors.accent,
  },
  shopName: {
    flex: 1,
    color: colors.ink,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  shopNameChecked: {
    textDecoration: 'line-through',
    color: colors.inkMuted,
  },
  shopAmount: {
    color: colors.inkSoft,
    fontSize: 13,
    fontWeight: 500,
    fontVariantNumeric: 'tabular-nums',
  },
  shopAmountChecked: {
    textDecoration: 'line-through',
    color: colors.inkMuted,
  },
  extraBadge: {
    fontSize: 10,
    fontWeight: 600,
    color: colors.accent,
    background: colors.accentSoft,
    padding: '2px 6px',
    borderRadius: 4,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  removeExtraBtn: {
    background: 'transparent',
    border: 'none',
    color: colors.inkMuted,
    padding: 4,
    display: 'flex',
  },
  addItemRow: {
    display: 'flex',
    gap: 8,
    alignItems: 'stretch',
  },
  addBtn: {
    background: colors.ink,
    color: colors.bg,
    border: 'none',
    width: 46,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    textAlign: 'center',
    padding: '48px 24px',
    color: colors.inkMuted,
  },
  emptyText: {
    fontFamily: "'Fraunces', serif",
    fontSize: 17,
    fontWeight: 500,
    color: colors.inkSoft,
    margin: '12px 0 4px',
  },
  emptyHint: {
    fontSize: 13,
    color: colors.inkMuted,
    margin: 0,
    maxWidth: 280,
    marginLeft: 'auto',
    marginRight: 'auto',
    lineHeight: 1.5,
  },
  // Bottom nav
  bottomNav: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    background: colors.bg,
    borderTop: `1px solid ${colors.line}`,
    display: 'flex',
    justifyContent: 'space-around',
    padding: '8px 0 14px',
    maxWidth: 540,
    margin: '0 auto',
  },
  navBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 3,
    background: 'transparent',
    border: 'none',
    padding: '8px 16px',
    color: colors.inkMuted,
    fontSize: 11,
    fontWeight: 500,
    transition: 'color 0.15s',
  },
  navBtnActive: {
    color: colors.accent,
  },
  navLabel: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.02em',
  },
  // Modal
  modalBackdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(42, 37, 32, 0.4)',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    zIndex: 100,
    animation: 'fadeIn 0.2s ease',
  },
  modalSheet: {
    background: colors.bg,
    borderRadius: '24px 24px 0 0',
    padding: '20px 20px 32px',
    width: '100%',
    maxWidth: 540,
    maxHeight: '80vh',
    overflowY: 'auto',
    animation: 'slideUp 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  modalTitle: {
    fontFamily: "'Fraunces', serif",
    fontSize: 22,
    fontWeight: 600,
    margin: 0,
  },
  modalSubtitle: {
    fontSize: 13,
    color: colors.inkMuted,
    margin: '0 0 16px',
  },
  modalClose: {
    background: 'transparent',
    border: 'none',
    color: colors.inkSoft,
    padding: 4,
    display: 'flex',
  },
  modalList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  modalItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: '14px 16px',
    background: colors.white,
    border: `1px solid ${colors.line}`,
    borderRadius: 12,
    textAlign: 'left',
    fontSize: 15,
    color: colors.ink,
    fontFamily: 'inherit',
  },
  modalItemActive: {
    background: colors.accentSoft,
    borderColor: colors.accent,
    color: colors.ink,
    fontWeight: 600,
  },
  modalItemName: {
    flex: 1,
  },
  modalItemDanger: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '12px 16px',
    background: 'transparent',
    border: 'none',
    color: colors.danger,
    fontSize: 14,
    fontWeight: 500,
    textAlign: 'left',
    marginBottom: 6,
  },
};

// Inject keyframes
if (typeof document !== 'undefined') {
  const styleId = 'veckomeny-keyframes';
  if (!document.getElementById(styleId)) {
    const s = document.createElement('style');
    s.id = styleId;
    s.textContent = `
      @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
      @keyframes slideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }
      @keyframes pulse { 0%, 100% { opacity: 0.4; transform: scale(0.9) } 50% { opacity: 1; transform: scale(1.1) } }
    `;
    document.head.appendChild(s);
  }
}

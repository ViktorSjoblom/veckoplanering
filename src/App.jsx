import React, { useState, useEffect } from 'react';
import { ChefHat, ShoppingBasket, Plus, Trash2, X, Check, Edit3, Calendar, Minus, ArrowLeft } from 'lucide-react';

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
  },
  {
    id: 'r2',
    name: 'Lax med potatis och yoghurtsås',
    portions: 4,
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
  },
  {
    id: 'r3',
    name: 'Paj med broccoli och skinka',
    portions: 4,
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
  },
  {
    id: 'r4',
    name: 'Köttfärssås med spaghetti',
    portions: 4,
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
  },

  // ===== Kött =====
  {
    id: 'r5',
    name: 'Pannbiff med lök och brunsås',
    portions: 4,
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
  },
  {
    id: 'r6',
    name: 'Chili con carne',
    portions: 4,
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
  },
  {
    id: 'r7',
    name: 'Tacos',
    portions: 4,
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
  },
  {
    id: 'r8',
    name: 'Fläskpannkaka',
    portions: 4,
    categories: ['kott', 'ugn'],
    ingredients: [
      { name: 'Vetemjöl', amount: 3, unit: 'dl' },
      { name: 'Mjölk', amount: 6, unit: 'dl' },
      { name: 'Ägg', amount: 3, unit: 'st' },
      { name: 'Rökt sidfläsk', amount: 200, unit: 'g' },
      { name: 'Salt', amount: 1, unit: 'krm' },
      { name: 'Lingonsylt', amount: 1, unit: 'burk' },
    ],
  },

  // ===== Kyckling =====
  {
    id: 'r9',
    name: 'Kycklinggryta med curry',
    portions: 4,
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
  },
  {
    id: 'r10',
    name: 'Ugnsbakad kyckling med klyftpotatis',
    portions: 4,
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
  },
  {
    id: 'r11',
    name: 'Kyckling tikka masala',
    portions: 4,
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
  },
  {
    id: 'r12',
    name: 'Kycklingwok med nudlar',
    portions: 4,
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
  },

  // ===== Fisk & skaldjur =====
  {
    id: 'r13',
    name: 'Fiskgratäng med räkor',
    portions: 4,
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
  },
  {
    id: 'r14',
    name: 'Sushi bowl med lax',
    portions: 4,
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
  },
  {
    id: 'r15',
    name: 'Fiskpinnar med potatismos',
    portions: 4,
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
  },
  {
    id: 'r16',
    name: 'Räkpasta med vitlök och chili',
    portions: 4,
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
  },

  // ===== Pasta =====
  {
    id: 'r17',
    name: 'Pasta carbonara',
    portions: 4,
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
  },
  {
    id: 'r18',
    name: 'Lasagne',
    portions: 6,
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
  },
  {
    id: 'r19',
    name: 'Krämig kycklingpasta',
    portions: 4,
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
  },
  {
    id: 'r20',
    name: 'Pesto-pasta med körsbärstomater',
    portions: 4,
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
  },

  // ===== Ugnsrätter =====
  {
    id: 'r21',
    name: 'Janssons frestelse',
    portions: 4,
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
  },
  {
    id: 'r22',
    name: 'Moussaka',
    portions: 6,
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
  },
  {
    id: 'r23',
    name: 'Korv stroganoff i ugn',
    portions: 4,
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
  },

  // ===== Grytor =====
  {
    id: 'r24',
    name: 'Boeuf bourguignon',
    portions: 6,
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
  },
  {
    id: 'r25',
    name: 'Kalops',
    portions: 4,
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
  },
  {
    id: 'r26',
    name: 'Marockansk lammgryta',
    portions: 4,
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
  },

  // ===== Soppor =====
  {
    id: 'r27',
    name: 'Köttfärssoppa',
    portions: 4,
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
  },
  {
    id: 'r28',
    name: 'Ramen med kyckling',
    portions: 4,
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
  },
  {
    id: 'r29',
    name: 'Tomatsoppa med grillad ost',
    portions: 4,
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
  },
  {
    id: 'r30',
    name: 'Linssoppa med kokos',
    portions: 4,
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
  },

  // ===== Vegetariskt =====
  {
    id: 'r31',
    name: 'Halloumiwrap med myntayoghurt',
    portions: 4,
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
  },
  {
    id: 'r32',
    name: 'Vegetarisk lasagne med linser',
    portions: 6,
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
  },
  {
    id: 'r33',
    name: 'Linsbiffar med ugnsrostade rotsaker',
    portions: 4,
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
  },

  // ===== Asiatiskt =====
  {
    id: 'r34',
    name: 'Pad thai',
    portions: 4,
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
  },
  {
    id: 'r35',
    name: 'Bibimbap',
    portions: 4,
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
  },
  {
    id: 'r36',
    name: 'Gyoza med dipsås',
    portions: 4,
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
  },
  {
    id: 'r37',
    name: 'Mapo tofu',
    portions: 4,
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
  },

  // ===== Snabbt =====
  {
    id: 'r38',
    name: 'Omelett med ost och skinka',
    portions: 2,
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
  },
  {
    id: 'r39',
    name: 'Quesadillas med kyckling',
    portions: 4,
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
          // Migration: ensure all recipes have categories field
          savedRecipes = savedRecipes.map(r => ({
            ...r,
            categories: r.categories || [],
          }));
          // Merge in any new starter recipes the user doesn't have yet (by id)
          const existingIds = new Set(savedRecipes.map(r => r.id));
          const newStarters = STARTER_RECIPES.filter(r => !existingIds.has(r.id));
          if (newStarters.length > 0) {
            savedRecipes = [...savedRecipes, ...newStarters];
            await window.storage.set('recipes', JSON.stringify(savedRecipes));
          }
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
                categories: [],
                ingredients: [{ name: '', amount: 1, unit: 'st' }],
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
              {r.ingredients.length} ingredienser · {r.portions} port
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
        <p style={styles.detailMeta}>{recipe.portions} portioner</p>
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

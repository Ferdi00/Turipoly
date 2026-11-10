(function(root) {
  const data = {
  "spaces": [
    {
      "name": "Via del Cartellino",
      "emoji": "🚪",
      "type": "start",
      "description": "Si timbra e si ricomincia. Incassa €200 quando passi di qui.",
      "label": "Ingresso"
    },
    {
      "name": "Scrivania vicino alla finestra",
      "emoji": "🪟",
      "type": "property",
      "price": 120,
      "rent": 24,
      "color": "#91ae78",
      "label": "Scrivania finestra",
      "group": "Scrivanie"
    },
    {
      "name": "La macchinetta del caffè",
      "emoji": "☕",
      "type": "event",
      "event": "coffee",
      "label": "Macchinetta caffè"
    },
    {
      "name": "Postazione con doppio monitor",
      "emoji": "🖥️",
      "type": "property",
      "price": 160,
      "rent": 32,
      "color": "#91ae78",
      "label": "Doppio monitor",
      "group": "Scrivanie"
    },
    {
      "name": "Stampante in sciopero",
      "emoji": "🖨️",
      "type": "event",
      "event": "printer",
      "label": "Stampante KO"
    },
    {
      "name": "Riunione che poteva essere un’email",
      "emoji": "📅",
      "type": "event",
      "event": "meeting",
      "label": "Riunione-email"
    },
    {
      "name": "Sala riunioni panoramica",
      "emoji": "🪴",
      "type": "property",
      "price": 200,
      "rent": 40,
      "color": "#81a57c",
      "label": "Sala panoramica",
      "group": "Spazi condivisi"
    },
    {
      "name": "Smart working dal divano",
      "emoji": "🛋️",
      "type": "event",
      "event": "remote",
      "label": "Smart working"
    },
    {
      "name": "Angolo snack",
      "emoji": "🍪",
      "type": "property",
      "price": 220,
      "rent": 44,
      "color": "#81a57c",
      "label": "Angolo snack",
      "group": "Spazi condivisi"
    },
    {
      "name": "Posto auto del direttore",
      "emoji": "🚗",
      "type": "property",
      "price": 240,
      "rent": 48,
      "color": "#81a57c",
      "label": "Parcheggio capo",
      "group": "Spazi condivisi"
    },
    {
      "name": "Riunione urgente con Turi",
      "emoji": "👔",
      "type": "jail",
      "description": "Turi ti vuole vedere. Salta un turno e prepara una slide.",
      "label": "Da Turi!"
    },
    {
      "name": "Progetto “per ieri”",
      "emoji": "⏰",
      "type": "property",
      "price": 260,
      "rent": 52,
      "color": "#d7a85a",
      "label": "Progetto urgente",
      "group": "Comfort"
    },
    {
      "name": "Il capo scrive “hai un minuto?”",
      "emoji": "💬",
      "type": "event",
      "event": "boss",
      "label": "“Hai un minuto?”"
    },
    {
      "name": "Ufficio con aria condizionata",
      "emoji": "❄️",
      "type": "property",
      "price": 280,
      "rent": 56,
      "color": "#d7a85a",
      "label": "Aria condizionata",
      "group": "Comfort"
    },
    {
      "name": "Distributore di snack",
      "emoji": "🥨",
      "type": "property",
      "price": 300,
      "rent": 60,
      "color": "#d7a85a",
      "label": "Distributore snack",
      "group": "Comfort"
    },
    {
      "name": "Venerdì, ore 16:59",
      "emoji": "🕔",
      "type": "event",
      "event": "friday",
      "label": "Venerdì 16:59"
    },
    {
      "name": "La sala riunioni è libera",
      "emoji": "🔑",
      "type": "property",
      "price": 320,
      "rent": 64,
      "color": "#ce8769",
      "label": "Sala riunioni libera",
      "group": "Progetti"
    },
    {
      "name": "Pranzo di team",
      "emoji": "🍝",
      "type": "event",
      "event": "lunch",
      "label": "Pranzo di team"
    },
    {
      "name": "Il tuo progetto preferito",
      "emoji": "💡",
      "type": "property",
      "price": 340,
      "rent": 68,
      "color": "#ce8769",
      "label": "Progetto preferito",
      "group": "Progetti"
    },
    {
      "name": "Bonus: obiettivo centrato",
      "emoji": "🎯",
      "type": "event",
      "event": "bonus",
      "label": "Obiettivo centrato"
    },
    {
      "name": "Ferie approvate",
      "emoji": "🏖️",
      "type": "rest",
      "description": "Una giornata senza notifiche. Incassa €100 di serenità.",
      "label": "Ferie!"
    },
    {
      "name": "Postazione del capo",
      "emoji": "🪑",
      "type": "property",
      "price": 380,
      "rent": 76,
      "color": "#a987ad",
      "label": "Postazione Turi",
      "group": "Direzione"
    },
    {
      "name": "La macchinetta si mangia la moneta",
      "emoji": "🪙",
      "type": "event",
      "event": "coin",
      "label": "Moneta inghiottita"
    },
    {
      "name": "Ufficio tutto per te",
      "emoji": "🏢",
      "type": "property",
      "price": 420,
      "rent": 84,
      "color": "#a987ad",
      "label": "Ufficio tutto tuo",
      "group": "Direzione"
    },
    {
      "name": "Fine mese: report spese",
      "emoji": "🧾",
      "type": "event",
      "event": "expenses",
      "label": "Report spese"
    },
    {
      "name": "La stampante finalmente funziona",
      "emoji": "✅",
      "type": "event",
      "event": "printerWin",
      "label": "Stampante OK"
    },
    {
      "name": "Terrazza aziendale",
      "emoji": "🌿",
      "type": "property",
      "price": 460,
      "rent": 92,
      "color": "#568a8b",
      "label": "Terrazza aziendale",
      "group": "Panorama"
    },
    {
      "name": "Turi offre il caffè",
      "emoji": "☕",
      "type": "event",
      "event": "turiCoffee",
      "label": "Caffè di Turi"
    },
    {
      "name": "Ufficio vista mare (quasi)",
      "emoji": "🌊",
      "type": "property",
      "price": 500,
      "rent": 100,
      "color": "#568a8b",
      "label": "Vista mare",
      "group": "Panorama"
    },
    {
      "name": "Promozione: da lunedì!",
      "emoji": "📈",
      "type": "event",
      "event": "promotion",
      "label": "Promozione"
    },
    {
      "name": "Festa aziendale",
      "emoji": "🎉",
      "type": "rest",
      "description": "Hai fatto networking vicino al buffet. Incassa €150.",
      "label": "Festa aziendale"
    },
    {
      "name": "Sala del consiglio",
      "emoji": "🏛️",
      "type": "property",
      "price": 560,
      "rent": 112,
      "color": "#5472a0",
      "label": "Sala del consiglio",
      "group": "Esclusivi"
    },
    {
      "name": "Imprevisto",
      "emoji": "🎲",
      "type": "event",
      "event": "chance",
      "label": "Imprevisto!"
    },
    {
      "name": "L’ufficio di Turi",
      "emoji": "👔",
      "type": "property",
      "price": 620,
      "rent": 124,
      "color": "#5472a0",
      "label": "Ufficio di Turi",
      "group": "Esclusivi"
    },
    {
      "name": "Team building obbligatorio",
      "emoji": "🧗",
      "type": "event",
      "event": "team",
      "label": "Team building"
    },
    {
      "name": "Giardino segreto dell’ufficio",
      "emoji": "🌳",
      "type": "property",
      "price": 680,
      "rent": 136,
      "color": "#5472a0",
      "label": "Giardino segreto",
      "group": "Esclusivi"
    },
    {
      "name": "Messaggio: “ci sentiamo lunedì”",
      "emoji": "📨",
      "type": "event",
      "event": "monday",
      "label": "Ci sentiamo lunedì"
    },
    {
      "name": "Parcheggio VIP",
      "emoji": "🅿️",
      "type": "property",
      "price": 740,
      "rent": 148,
      "color": "#6f849b",
      "label": "Parcheggio VIP",
      "group": "Parcheggi"
    },
    {
      "name": "Revisione budget",
      "emoji": "📉",
      "type": "event",
      "event": "budget",
      "label": "Revisione budget"
    },
    {
      "name": "Parcheggio coperto",
      "emoji": "🚘",
      "type": "property",
      "price": 780,
      "rent": 156,
      "color": "#6f849b",
      "label": "Parcheggio coperto",
      "group": "Parcheggi"
    }
  ],
  "colors": [
    "#276b98",
    "#b34c35",
    "#80559c",
    "#8a6414"
  ]
};
  if (typeof module === "object" && module.exports) module.exports = data;
  else root.TuripolyData = data;
})(typeof globalThis !== "undefined" ? globalThis : this);

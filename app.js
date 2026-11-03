"use strict";

const FAV_KEY = "perelki-ulubione-v2";
const SEEN_KEY = "perelki-seen-ids-v1";
const MONTHS = ["sty", "lut", "mar", "kwi", "maj", "cze", "lip", "sie", "wrz", "paź", "lis", "gru"];
const DEAL_RANK = { perelka: 0, dobra: 1, aukcja: 2, rynek: 3, drogo: 4 };

const HEART = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-7-9a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 4.6-7 9-7 9z"></path></svg>';

const state = {
  data: null,
  segment: "klasyki",
  tab: "top",
  q: "",
  cat: "all",
  brand: "all",
  cond: "all",
  onlyProfit: false,
  onlyRare: false,
  maxP: "any",
  sort: "deal",
  favs: { order: [], items: {} },
  fresh: new Set(),
  persistOk: true,
};

const DATA_URL = new URL("data/listings.json", document.currentScript.src);
const board = document.getElementById("board");
const statusEl = document.getElementById("status");
const persistEl = document.getElementById("persist");

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[ch]));
}

function safeUrl(value) {
  try {
    const url = new URL(value);
    if (url.protocol === "https:" || url.protocol === "http:") return url.href;
  } catch (err) {
    return "";
  }
  return "";
}

function grouped(amount) {
  return Math.round(Number(amount)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function money(amount) {
  return grouped(amount) + " $";
}

function miles(amount) {
  return grouped(amount) + " mil";
}

function dateLabel(iso) {
  const parts = String(iso).split("-");
  const month = MONTHS[Number(parts[1]) - 1] || "";
  return Number(parts[2]) + " " + month;
}

function readJson(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    return null;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    state.persistOk = false;
    return false;
  }
}

function loadFavs() {
  const saved = readJson(FAV_KEY);
  if (saved && Array.isArray(saved.order) && saved.items && typeof saved.items === "object") {
    state.favs = { order: saved.order.filter((id) => typeof id === "string"), items: saved.items };
    return;
  }
  const legacy = readJson("perelki-ulubione-v1");
  if (Array.isArray(legacy)) {
    state.favs = { order: legacy.filter((id) => typeof id === "string"), items: {} };
    saveFavs();
    return;
  }
  state.favs = { order: [], items: {} };
}

function segmentOf(listing) {
  return (listing && listing.segment) || "klasyki";
}

function favIdsForSegment() {
  const live = byIdMap();
  return state.favs.order.filter((id) => {
    const current = live.get(id);
    const snap = state.favs.items[id];
    return segmentOf(current || snap) === state.segment;
  });
}

function saveFavs() {
  writeJson(FAV_KEY, state.favs);
}

function markFresh(listings) {
  const seen = readJson(SEEN_KEY);
  const ids = listings.map((listing) => listing.id);
  if (!Array.isArray(seen)) {
    writeJson(SEEN_KEY, ids);
    state.fresh = new Set();
    return;
  }
  const known = new Set(seen.filter((id) => typeof id === "string"));
  state.fresh = new Set(ids.filter((id) => !known.has(id)));
  writeJson(SEEN_KEY, Array.from(new Set(seen.concat(ids))));
}

function byIdMap() {
  return new Map(state.data.listings.map((listing) => [listing.id, listing]));
}

function listingEntries() {
  const live = byIdMap();
  if (state.tab === "top") {
    const picks = state.segment === "nowsze" ? (state.data.topPicksNowsze || []) : state.data.topPicks;
    return picks
      .map((id) => live.get(id))
      .filter((listing) => listing && segmentOf(listing) === state.segment)
      .map((listing) => ({ listing, gone: false }));
  }
  if (state.tab === "fav") {
    return favIdsForSegment().map((id) => {
      const current = live.get(id);
      if (current) return { listing: current, gone: false };
      const snapshot = state.favs.items[id];
      if (snapshot && typeof snapshot === "object") return { listing: snapshot, gone: true };
      return {
        listing: {
          id,
          title: "Ogłoszenie usunięte",
          price: null,
          mileage: null,
          city: "",
          distanceMiles: null,
          source: "",
          url: "",
          photo: "",
          condition: "",
          category: "",
          deal: "",
          note: "To ogłoszenie zniknęło z tablicy. Zapisana treść nie jest już dostępna.",
          posted: null,
          auctionEnd: null,
          scamWarning: null,
          flags: [],
        },
        gone: true,
      };
    });
  }
  return state.data.listings
    .filter((listing) => segmentOf(listing) === state.segment)
    .map((listing) => ({ listing, gone: false }));
}

function profitNumbers(listing) {
  const p = listing.profit || {};
  const buy = p.buyPrice == null ? null : Number(p.buyPrice);
  const asIs = p.sellAsIsValue == null || buy == null || buy <= 0 ? null : Number(p.sellAsIsValue) - buy;
  const after = p.sellAfterRepairValue == null || p.estPartsCost == null || buy == null || buy <= 0
    ? null
    : Number(p.sellAfterRepairValue) - buy - Number(p.estPartsCost);
  return { asIs, after };
}

function bestProfit(listing) {
  const { asIs, after } = profitNumbers(listing);
  const values = [asIs, after].filter((n) => n != null);
  return values.length ? Math.max(...values) : null;
}

function matches(listing) {
  if (state.cat !== "all" && listing.category !== state.cat) return false;
  if (state.brand !== "all" && listing.brand !== state.brand) return false;
  if (state.cond !== "all" && listing.condition !== state.cond) return false;
  if (state.onlyRare && !listing.rare) return false;
  if (state.onlyProfit) {
    const { asIs, after } = profitNumbers(listing);
    if (!((asIs != null && asIs > 0) || (after != null && after > 0))) return false;
  }
  if (state.maxP !== "any" && !(Number(listing.price) <= Number(state.maxP))) return false;
  const words = state.q.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const labels = state.data.labels || {};
  const hay = [
    listing.title,
    listing.city,
    listing.note,
    listing.marketNote,
    listing.know,
    listing.source,
    listing.scamWarning,
    labels.brand && labels.brand[listing.brand],
    listing.profit && listing.profit.compNote,
    ...(Array.isArray(listing.flags) ? listing.flags : []),
  ].join(" ").toLowerCase();
  return words.every((word) => hay.includes(word));
}

function sorted(entries) {
  const copy = entries.slice();
  const updatedDay = String(state.data.updated || "").slice(0, 10) || "0000-00-00";
  const price = (entry) => Number(entry.listing.price) || 0;
  const dist = (entry) => Number(entry.listing.distanceMiles) || 0;
  if (state.sort === "price") {
    copy.sort((a, b) => price(a) - price(b) || dist(a) - dist(b));
  } else if (state.sort === "dist") {
    copy.sort((a, b) => dist(a) - dist(b) || price(a) - price(b));
  } else if (state.sort === "new") {
    const day = (entry) => entry.listing.posted || updatedDay;
    copy.sort((a, b) => day(b).localeCompare(day(a)) || price(a) - price(b));
  } else if (state.sort === "profit") {
    const gain = (entry) => bestProfit(entry.listing);
    copy.sort((a, b) => {
      const ga = gain(a);
      const gb = gain(b);
      if (ga == null && gb == null) return price(a) - price(b);
      if (ga == null) return 1;
      if (gb == null) return -1;
      return gb - ga || price(a) - price(b);
    });
  } else if (state.tab === "top") {
    const order = new Map(state.data.topPicks.map((id, index) => [id, index]));
    copy.sort((a, b) => (order.get(a.listing.id) ?? 99) - (order.get(b.listing.id) ?? 99));
  } else {
    copy.sort((a, b) => (DEAL_RANK[a.listing.deal] ?? 9) - (DEAL_RANK[b.listing.deal] ?? 9) || price(a) - price(b));
  }
  return copy;
}

function moneyOrBlank(value) {
  return value == null || value === "" ? "brak danych" : money(value);
}

function profitCell(value) {
  if (value == null) return "brak danych";
  const text = (value < 0 ? "−" : "") + money(Math.abs(value));
  const cls = value > 0 ? "pos" : value < 0 ? "neg" : "";
  return `<span class="${cls}">${esc(text)}</span>`;
}

function estimateHtml(listing) {
  const p = listing.profit || {};
  const nums = profitNumbers(listing);
  const comp = p.compNote ? `<p class="comp">${esc(p.compNote)}</p>` : "";
  return `
    <dl class="estimate">
      <div><dt>Kupno</dt><dd>${esc(moneyOrBlank(p.buyPrice))}</dd></div>
      <div><dt>Sprzedaż bez pracy</dt><dd>${esc(moneyOrBlank(p.sellAsIsValue))}</dd></div>
      <div><dt>Po naprawie</dt><dd>${esc(moneyOrBlank(p.sellAfterRepairValue))}</dd></div>
      <div><dt>Koszt części</dt><dd>${esc(moneyOrBlank(p.estPartsCost))}</dd></div>
      ${p.suggestedOffer != null ? `<div><dt>Oferta do negocjacji</dt><dd>${esc(money(p.suggestedOffer))} <span class="kind">szacunek</span></dd></div>` : ""}
      <div class="wide"><dt>Potencjalny zysk</dt><dd>bez pracy: ${profitCell(nums.asIs)} · po naprawie: ${profitCell(nums.after)}${p.suggestedOffer != null && p.sellAsIsValue != null ? " · przy ofercie: " + profitCell(Number(p.sellAsIsValue) - Number(p.suggestedOffer)) : ""}</dd></div>
    </dl>
    ${comp}`;
}

function whenLabel(listing) {
  if (listing.auctionEnd) return "koniec: " + listing.auctionEnd;
  if (listing.posted) return "dodane " + dateLabel(listing.posted);
  return "data nieznana";
}

function cardHtml(entry) {
  const listing = entry.listing;
  const labels = state.data.labels || { deal: {}, category: {}, condition: {} };
  const dealLabel = labels.deal[listing.deal] || "";
  const catLabel = labels.category[listing.category] || "";
  const condLabel = labels.condition[listing.condition] || "";
  const kind = [catLabel, condLabel].filter(Boolean).join(" · ");
  const bits = [];
  if (listing.mileage != null && listing.mileage !== "") bits.push(miles(listing.mileage));
  if (listing.city) {
    const away = listing.distanceMiles != null ? listing.city + " · " + listing.distanceMiles + " mil od San Mateo" : listing.city;
    bits.push(away);
  }
  const price = listing.price == null || listing.price === ""
    ? ""
    : (listing.auctionEnd ? "Oferta: " + money(listing.price) : money(listing.price));
  const flags = Array.isArray(listing.flags) ? listing.flags : [];
  const estimate = estimateHtml(listing);
  const url = safeUrl(listing.url);
  const photo = safeUrl(listing.photo);
  const fav = state.favs.order.includes(listing.id);
  const isNew = !entry.gone && state.fresh.has(listing.id);
  const sourceLine = [listing.source, entry.gone ? "" : whenLabel(listing)].filter(Boolean).join(" · ");
  const inner = `
    ${photo ? `<div class="photo"><img src="${esc(photo)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer"></div>` : ""}
    <div class="body">
      ${entry.gone ? '<p class="gone-banner">Ogłoszenie usunięte</p>' : ""}
      <div class="row">
        ${dealLabel ? `<span class="deal deal-${esc(listing.deal)}">${esc(dealLabel)}</span>` : ""}
        ${listing.rare ? '<span class="badge-rare">Rzadkie</span>' : ""}
        ${isNew ? '<span class="badge-new">Nowe</span>' : ""}
        ${kind ? `<span class="kind">${esc(kind)}</span>` : ""}
      </div>
      <h2>${esc(listing.title || "Ogłoszenie")}</h2>
      ${price ? `<p class="price">${esc(price)}</p>` : ""}
      ${bits.length ? `<p class="meta">${esc(bits.join(" · "))}</p>` : ""}
      ${listing.note ? `<p class="note">${esc(listing.note)}</p>` : ""}
      ${listing.know ? `<p class="know"><strong>Co warto wiedzieć.</strong> ${esc(listing.know)}</p>` : ""}
      ${estimate}
      ${flags.length ? `<ul class="flags">${flags.map((flag) => `<li>${esc(flag)}</li>`).join("")}</ul>` : ""}
      ${listing.scamWarning ? `<p class="scam">Red flag: ${esc(listing.scamWarning)}</p>` : ""}
      ${sourceLine ? `<p class="src">${esc(sourceLine)}</p>` : ""}
      ${url ? '<span class="cta">Otwórz ogłoszenie</span>' : ""}
    </div>`;
  const heart = `<button type="button" class="heart" data-id="${esc(listing.id)}" aria-pressed="${fav ? "true" : "false"}" aria-label="${fav ? "Usuń z ulubionych" : "Dodaj do ulubionych"}">${HEART}</button>`;
  const linked = url
    ? `<a class="card-link" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${inner}</a>`
    : `<div class="card-link">${inner}</div>`;
  return `<article class="card${entry.gone ? " gone" : ""}">${heart}${linked}</article>`;
}

function render() {
  const all = listingEntries();
  const shown = sorted(all.filter((entry) => matches(entry.listing)));
  board.innerHTML = shown.map(cardHtml).join("");
  board.querySelectorAll("img").forEach((img) => {
    img.addEventListener("error", () => hideBrokenImage(img));
  });

  document.getElementById("fav-count").textContent = String(favIdsForSegment().length);
  document.querySelectorAll("[data-segment]").forEach((button) => {
    button.setAttribute("aria-pressed", button.dataset.segment === state.segment ? "true" : "false");
  });
  document.querySelectorAll("[data-tab]").forEach((button) => {
    button.setAttribute("aria-pressed", button.dataset.tab === state.tab ? "true" : "false");
  });
  document.getElementById("only-profit").setAttribute("aria-pressed", state.onlyProfit ? "true" : "false");
  document.getElementById("only-rare").setAttribute("aria-pressed", state.onlyRare ? "true" : "false");
  document.querySelectorAll("[data-cond]").forEach((button) => {
    button.setAttribute("aria-pressed", button.dataset.cond === state.cond ? "true" : "false");
  });

  if (state.tab === "fav" && state.favs.order.length === 0) {
    statusEl.textContent = "Nie masz jeszcze ulubionych. Kliknij serduszko na ogłoszeniu — zostaną zapisane na tym telefonie.";
  } else if (shown.length === 0) {
    statusEl.textContent = "Nic nie pasuje do tych filtrów. Poluzuj cenę albo wyczyść wyszukiwanie.";
  } else {
    statusEl.textContent = "Pokazuję " + shown.length + " z " + all.length + ".";
  }

  persistEl.hidden = state.persistOk;
  if (!state.persistOk) {
    persistEl.textContent = "Ta przeglądarka nie zapisuje ulubionych na stałe. Zostaną do odświeżenia strony.";
  }
}

function hideBrokenImage(img) {
  const frame = img.closest(".photo");
  if (frame) frame.remove();
  else img.remove();
}

function toggleFav(id) {
  const index = state.favs.order.indexOf(id);
  if (index >= 0) {
    state.favs.order.splice(index, 1);
    delete state.favs.items[id];
  } else {
    const live = byIdMap().get(id) || state.favs.items[id];
    if (!live) return;
    state.favs.order.unshift(id);
    state.favs.items[id] = live;
  }
  saveFavs();
  render();
  const again = board.querySelector('.heart[data-id="' + CSS.escape(id) + '"]');
  if (again) again.focus();
}

function bind() {
  document.getElementById("filters").addEventListener("submit", (event) => event.preventDefault());
  document.getElementById("q").addEventListener("input", (event) => {
    state.q = event.target.value.trim();
    render();
  });
  document.getElementById("maxp").addEventListener("change", (event) => {
    state.maxP = event.target.value;
    render();
  });
  document.getElementById("sort").addEventListener("change", (event) => {
    state.sort = event.target.value;
    render();
  });
  document.getElementById("cat").addEventListener("change", (event) => {
    state.cat = event.target.value;
    render();
  });
  document.getElementById("brand").addEventListener("change", (event) => {
    state.brand = event.target.value;
    render();
  });
  document.getElementById("only-profit").addEventListener("click", () => {
    state.onlyProfit = !state.onlyProfit;
    render();
  });
  document.getElementById("only-rare").addEventListener("click", () => {
    state.onlyRare = !state.onlyRare;
    render();
  });
  document.querySelectorAll("[data-cond]").forEach((button) => {
    button.addEventListener("click", () => {
      state.cond = button.dataset.cond;
      render();
    });
  });
  document.querySelectorAll("[data-segment]").forEach((button) => {
    button.addEventListener("click", () => {
      state.segment = button.dataset.segment;
      render();
    });
  });
  document.querySelectorAll("[data-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      state.tab = button.dataset.tab;
      render();
    });
  });
  board.addEventListener("click", (event) => {
    const button = event.target.closest(".heart");
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    toggleFav(button.dataset.id);
  });
}

function refreshStoredCopies() {
  const live = byIdMap();
  let changed = false;
  state.favs.order.forEach((id) => {
    if (live.has(id)) {
      state.favs.items[id] = live.get(id);
      changed = true;
    }
  });
  if (changed) saveFavs();
}

async function init() {
  bind();
  loadFavs();
  try {
    const response = await fetch(DATA_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(String(response.status));
    state.data = await response.json();
  } catch (err) {
    statusEl.textContent = "Nie udało się wczytać ogłoszeń. Odśwież stronę.";
    return;
  }
  const updated = document.getElementById("updated");
  updated.dateTime = state.data.updated || "";
  updated.textContent = state.data.updatedLabel || state.data.updated || "";
  document.getElementById("safety").textContent = state.data.safety || "";
  const brandSelect = document.getElementById("brand");
  const brands = state.data.labels && state.data.labels.brand ? state.data.labels.brand : {};
  for (const [value, label] of Object.entries(brands)) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    brandSelect.appendChild(option);
  }
  refreshStoredCopies();
  markFresh(state.data.listings || []);
  render();
}

init();

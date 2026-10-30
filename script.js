const PHONE_LINK = "tel:+79147036933";
const PHONE_TEXT = "8 914 703-69-33";
const SMS_NUMBER = "+79147036933";
// Ссылка на мамин профиль в MAX. Пока пусто — кнопка «Спросить в MAX» скрыта.
const MAX_LINK = "";

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
const money = n => n.toLocaleString("ru-RU") + " ₽";
// Артикул без пробелов, дефисов и точек — чтобы «KYB 334-505» нашлось как «334505»
const norm = s => String(s).toLowerCase().replace(/[\s\-./]/g, "");

// Иконки разделов
const svg = inner => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
const ICONS = [
  svg('<path d="M12 2v4M12 14v2M12 20v2"/><rect x="9" y="6" width="6" height="8" rx="1"/><rect x="10" y="16" width="4" height="4" rx="1"/>'),
  svg('<path d="M12 2v3"/><rect x="9.5" y="5" width="5" height="9" rx="1"/><path d="M12 14v3"/><path d="M8 17l8 2.5M8 19.5 16 22"/>'),
  svg('<path d="M7 3h10M7 21h10M7 6l10 2.5L7 11l10 2.5L7 16l10 2.5"/>'),
  svg('<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 4v2M12 18v2M4 12h2M18 12h2"/>'),
  svg('<path d="M8 4h8l-1 3 2 2-2 2 2 2-2 2 2 2-1 3H8l1-3-2-2 2-2-2-2 2-2-2-2z"/>'),
];

// Товары из прайса: [раздел, бренд, артикул, название, сторона, применимость, цена]
const ITEMS = PARTS.map((r, i) => {
  const [cat, brand, article, name, side, fits, price] = r;
  const isMain = /^(kyb|obk)$/i.test(brand);
  return { i, cat, brand, article, name, side, fits, price, isMain,
    text: [brand, article, name, side, fits, PART_CATEGORIES[cat]].join(" ").toLowerCase(), art: norm(article) };
});
// Сначала KYB и OBK — основное в магазине
ITEMS.sort((a, b) => (b.isMain - a.isMain) || a.cat - b.cat || a.brand.localeCompare(b.brand) || a.article.localeCompare(b.article));

// Марки и модели для подбора «марка → модель»
const MODELS = {
  Toyota: ["Corolla", "Camry", "Land Cruiser", "Prado", "RAV4", "Prius", "Caldina", "Mark II", "Yaris", "Vitz", "Carina", "Corona", "Wish", "Hiace", "Ipsum", "Highlander", "Avensis", "Premio", "Allion", "Crown", "Celica", "Hilux", "Noah", "Voxy", "Probox", "Succeed", "Harrier", "Vista", "Estima", "Fielder", "Funcargo", "Fortuner", "Alphard", "Aqua", "Auris", "Chaser", "Cresta", "4Runner"],
  Nissan: ["X-Trail", "Juke", "Almera", "Qashqai", "Primera", "Terrano", "Pathfinder", "Sunny", "Serena", "Murano", "Micra", "Tiida", "Teana", "Patrol", "Maxima", "Leaf", "Wingroad", "Note", "March", "Cube", "Liberty", "Presage", "Bluebird", "Cefiro", "Laurel", "Skyline", "Elgrand"],
  Honda: ["CR-V", "Fit", "HR-V", "Civic", "Jazz", "Accord", "Stream", "Airwave", "Vezel", "Odyssey", "Shuttle", "Freed", "Stepwgn", "Partner", "Orthia"],
  Mazda: ["Demio", "MPV", "CX-5", "CX-7", "Tribute", "Bongo", "Premacy", "Familia", "Atenza", "Axela", "Capella"],
  Mitsubishi: ["Pajero", "Outlander", "Lancer", "Colt", "ASX", "Delica", "Canter", "Airtrek", "RVR", "Galant", "Mirage"],
  Subaru: ["Forester", "Impreza", "Legacy", "Outback", "Justy", "XV"],
  Suzuki: ["Grand Vitara", "Escudo", "Swift", "SX4", "Ignis", "Jimny", "Wagon R"],
  Lexus: ["RX", "ES", "NX", "GX", "GS", "IS", "LX"],
  Daihatsu: ["Terios", "Cuore", "Charade", "Sirion"],
  Isuzu: ["Trooper", "Elf", "Bighorn"],
  Hyundai: ["Creta", "Solaris", "Accent", "Tucson", "Santa Fe", "Elantra", "Getz", "Sonata"],
  Kia: ["Sorento", "Soul", "Venga", "Rio", "Sportage", "Ceed", "Optima"],
};
const CARS = Object.keys(MODELS);
const carOf = it => CARS.filter(c => it.fits.toLowerCase().includes(c.toLowerCase()));
ITEMS.forEach(it => { it.cars = carOf(it); it.FITS = it.fits.toUpperCase(); });

// Модель ищем отдельным словом: «Fit» не находится в «FITS», а «RX» находится в «RX300»
const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const modelRe = m => new RegExp("(^|[^A-Z0-9])" + escRe(m.toUpperCase()).replace(/[-\s]/g, "[-\\s]?") + "(?![A-Z])");
const MODEL_RE = {}, MODEL_COUNT = {};
CARS.forEach(c => MODELS[c].forEach(m => {
  MODEL_RE[m] = modelRe(m);
  MODEL_COUNT[m] = ITEMS.filter(it => MODEL_RE[m].test(it.FITS)).length;
}));

// Место установки (перед/зад, лев/прав) — для пары и аналогов
const placeOf = s => ({ front: /перед/i.test(s), rear: /зад/i.test(s), left: /лев/i.test(s), right: /прав/i.test(s) });
const samePlace = (a, b) =>
  (!(a.front || a.rear) || !(b.front || b.rear) || (a.front && b.front) || (a.rear && b.rear)) &&
  (!(a.left || a.right) || !(b.left || b.right) || (a.left && b.left) || (a.right && b.right));
// Коды кузова из применимости (ACV40, GX81, ZRE152…) — по ним ищем аналоги других брендов
const NOT_CODES = /^(2WD|4WD|AWD|4X4|4X2|\d+V|\d+MM|\d+L)$/;
const codesOf = t => new Set((t.match(/[A-Z0-9]+(?:-[A-Z0-9]+)?/g) || [])
  .filter(c => c.length >= 3 && /\d/.test(c) && /[A-Z]/.test(c) && !NOT_CODES.test(c)));
// Применимость без пометок стороны («-- FR», «LH», «перед прав»), чтобы левая и правая совпали
const baseFits = t => t.toUpperCase().replace(/--\s*(FR|FL|RR|RL|F|R)\b/g, "").replace(/\b(LH|RH|LEFT|RIGHT|FRONT|REAR)\b/g, "").replace(/\s+/g, " ").trim();
ITEMS.forEach(it => { it.place = placeOf(it.side); it.codes = codesOf(it.FITS); it.base = baseFits(it.fits); });

const PAGE = 30;
const state = { cat: null, car: "", model: "", brand: "", query: "", shown: PAGE };

const $ = id => document.getElementById(id);
const grid = $("productGrid"), count = $("catalogCount"), empty = $("emptyState"), moreBtn = $("moreBtn");
const searchInput = $("searchInput"), brandSelect = $("brandSelect");

// Цифры в шапке
const brands = [...new Set(ITEMS.map(it => it.brand))];
document.querySelectorAll("[data-total]").forEach(el => el.textContent = ITEMS.length.toLocaleString("ru-RU"));
document.querySelectorAll("[data-brands]").forEach(el => el.textContent = brands.length - 2);
document.querySelectorAll("[data-updated]").forEach(el => el.textContent = PARTS_UPDATED);

// Бренды в выпадающем списке: KYB и OBK первыми, дальше по количеству
const brandCount = {};
ITEMS.forEach(it => { brandCount[it.brand] = (brandCount[it.brand] || 0) + 1; });
const brandOrder = Object.keys(brandCount).sort((a, b) =>
  (/^(kyb|obk)$/i.test(b) - /^(kyb|obk)$/i.test(a)) || brandCount[b] - brandCount[a]);
brandSelect.innerHTML += brandOrder.map(b => `<option value="${escapeHtml(b)}">${escapeHtml(b)} (${brandCount[b]})</option>`).join("");

function matches(it, words, compact) {
  if (state.cat !== null && it.cat !== state.cat) return false;
  if (state.model) { if (!MODEL_RE[state.model].test(it.FITS)) return false; }
  else if (state.car && !it.cars.includes(state.car)) return false;
  if (state.brand && it.brand !== state.brand) return false;
  if (!words.length) return true;
  return words.every(w => it.text.includes(w)) || (compact.length >= 3 && it.art.includes(compact));
}

function filtered() {
  const words = state.query.toLowerCase().split(/\s+/).filter(Boolean);
  const compact = norm(state.query);
  return ITEMS.filter(it => matches(it, words, compact));
}

function card(it) {
  return `
  <article class="card part" data-i="${it.i}" tabindex="0">
    <div class="part__top">
      <span class="part__icon">${ICONS[it.cat]}</span>
      <span class="part__brand${it.isMain ? " part__brand--main" : ""}">${escapeHtml(it.brand)}</span>
    </div>
    <div class="part__article">${escapeHtml(it.article)}</div>
    <h3 class="card__name">${escapeHtml(it.name)}${it.side ? ` <span class="part__side">${escapeHtml(it.side)}</span>` : ""}</h3>
    ${it.fits ? `<p class="part__fits">${escapeHtml(it.fits)}</p>` : ""}
    <div class="card__price">${money(it.price)}</div>
  </article>`;
}

function renderChips() {
  $("categoryChips").innerHTML =
    `<button class="chip ${state.cat === null ? "is-active" : ""}" data-cat="">Все разделы</button>` +
    PART_CATEGORIES.map((c, n) => `<button class="chip ${state.cat === n ? "is-active" : ""}" data-cat="${n}">${escapeHtml(c)}</button>`).join("");
  $("carChips").innerHTML = `<span class="chips__label">Машина:</span>` +
    ["", ...CARS].map(c => `<button class="chip chip--small ${state.car === c ? "is-active" : ""}" data-car="${c}">${c || "Любая"}</button>`).join("");
  const models = state.car ? MODELS[state.car].filter(m => MODEL_COUNT[m] > 0) : [];
  $("modelRow").hidden = !models.length;
  $("modelSelect").innerHTML = `<option value="">Все модели ${state.car}</option>` +
    models.map(m => `<option value="${m}"${state.model === m ? " selected" : ""}>${m} (${MODEL_COUNT[m]})</option>`).join("");
  brandSelect.value = state.brand;
}

function render() {
  renderChips();
  const list = filtered();
  $("catalogTitle").textContent = (state.cat === null ? "Каталог" : PART_CATEGORIES[state.cat]) +
    (state.model ? ` для ${state.car} ${state.model}` : state.car ? ` для ${state.car}` : "");
  count.textContent = list.length ? `Найдено: ${list.length.toLocaleString("ru-RU")}` : "";
  empty.hidden = list.length > 0;
  grid.innerHTML = list.slice(0, state.shown).map(card).join("");
  const left = list.length - state.shown;
  moreBtn.hidden = left <= 0;
  moreBtn.textContent = `Показать ещё (${left.toLocaleString("ru-RU")})`;
}

const reset = () => { state.shown = PAGE; render(); };
const toCatalog = () => $("catalog").scrollIntoView({ behavior: "smooth" });

// Плитки разделов на первом экране
$("tiles").innerHTML = PART_CATEGORIES.map((c, n) => `
  <button class="tile" data-cat="${n}">
    <span class="tile__icon">${ICONS[n]}</span>
    <span>${escapeHtml(c)}</span>
    <small>${ITEMS.filter(it => it.cat === n).length}</small>
  </button>`).join("");
$("tiles").addEventListener("click", e => {
  const t = e.target.closest(".tile");
  if (!t) return;
  state.cat = Number(t.dataset.cat);
  reset();
  toCatalog();
});

$("categoryChips").addEventListener("click", e => {
  const b = e.target.closest("[data-cat]");
  if (!b) return;
  state.cat = b.dataset.cat === "" ? null : Number(b.dataset.cat);
  reset();
});
$("carChips").addEventListener("click", e => {
  const b = e.target.closest("[data-car]");
  if (!b) return;
  state.car = b.dataset.car;
  state.model = "";
  reset();
});
$("modelSelect").addEventListener("change", e => { state.model = e.target.value; reset(); });
brandSelect.addEventListener("change", () => { state.brand = brandSelect.value; reset(); });

$("searchForm").addEventListener("submit", e => {
  e.preventDefault();
  state.query = searchInput.value;
  reset();
  toCatalog();
});
let typing;
searchInput.addEventListener("input", () => {
  clearTimeout(typing);
  typing = setTimeout(() => { state.query = searchInput.value; reset(); }, 200);
});
moreBtn.addEventListener("click", () => { state.shown += PAGE; render(); });

// Окно товара
const modal = $("productModal"), modalBody = $("modalBody");
let currentPart = null;
function openPart(i) {
  const it = ITEMS.find(x => x.i === i);
  if (!it) return;
  currentPart = i;
  const rows = [
    ["Раздел", PART_CATEGORIES[it.cat]],
    ["Бренд", it.brand],
    ["Артикул", it.article],
    ["Установка", it.side],
    ["Подходит", it.fits],
  ].filter(([, v]) => v);
  modalBody.innerHTML = `
    <div class="modal__img modal__img--icon">${ICONS[it.cat]}</div>
    <div class="modal__body">
      <h2>${escapeHtml(it.name)}</h2>
      <table class="specs">${rows.map(([k, v]) => `<tr><td>${k}</td><td>${escapeHtml(v)}</td></tr>`).join("")}</table>
      <div class="modal__price">${money(it.price)}</div>
      <p class="modal__note">Цена по прайсу от ${PARTS_UPDATED}. Наличие уточняйте по телефону.</p>
      <div class="ask">
        <a class="btn btn--call btn--big" href="${PHONE_LINK}">Позвонить: ${PHONE_TEXT}</a>
        <a class="btn btn--ghost" href="sms:${SMS_NUMBER}?&body=${encodeURIComponent(askText(it))}">Спросить по СМС</a>
        ${MAX_LINK ? `<button class="btn btn--max" data-ask-max>Спросить в MAX</button>` : ""}
        <button class="btn btn--ghost" data-copy>Скопировать артикул</button>
      </div>
      <p class="ask__tip" id="askTip" hidden></p>
      ${related("Для этой же машины", sameCar(it), "Тот же бренд и та же машина — например, вторая сторона, чтобы поменять парой.")}
      ${related("Аналоги других брендов", analogs(it), "Подобраны по коду кузова и месту установки. Точную совместимость сверим по телефону.")}
    </div>`;
  modal.showModal();
  modal.scrollTop = 0;
}

// Текст вопроса маме — сразу с брендом, артикулом и названием
const askText = it => `Здравствуйте! Есть в наличии ${it.brand} ${it.article} — ${it.name}${it.side ? " (" + it.side + ")" : ""}? Нашёл на сайте «Амортизаторы-Пружины».`;

// Для той же машины: тот же бренд и та же применимость (пара, пружины, опоры…)
function sameCar(it) {
  if (!it.fits) return [];
  return ITEMS.filter(x => x !== it && x.brand === it.brand && x.base === it.base)
    .sort((a, b) => a.cat - b.cat || a.price - b.price).slice(0, 6);
}

// Аналоги: другой бренд, тот же раздел и место установки, общий код кузова
function analogs(it) {
  if (!it.codes.size) return [];
  return ITEMS.filter(x => x.brand !== it.brand && x.cat === it.cat && samePlace(x.place, it.place) && [...x.codes].some(c => it.codes.has(c)))
    .sort((a, b) => a.price - b.price).slice(0, 6);
}

function related(title, list, hint) {
  if (!list.length) return "";
  return `<section class="related">
    <h3>${title}</h3>
    <p class="related__hint">${hint}</p>
    ${list.map(x => `<button class="related__item" data-open="${x.i}">
      <span><b>${escapeHtml(x.brand)} ${escapeHtml(x.article)}</b> · ${escapeHtml(x.name)}${x.side ? ` <span class="part__side">${escapeHtml(x.side)}</span>` : ""}</span>
      <span class="related__price">${money(x.price)}</span>
    </button>`).join("")}
  </section>`;
}

modalBody.addEventListener("click", async e => {
  const open = e.target.closest("[data-open]");
  if (open) { openPart(Number(open.dataset.open)); return; }
  const it = ITEMS.find(x => x.i === currentPart);
  const tip = $("askTip");
  if (e.target.closest("[data-copy]")) {
    try { await navigator.clipboard.writeText(it.article); tip.textContent = `Артикул ${it.article} скопирован.`; }
    catch { tip.textContent = `Артикул: ${it.article}`; }
    tip.hidden = false;
  }
  if (e.target.closest("[data-ask-max]")) {
    try { await navigator.clipboard.writeText(askText(it)); tip.textContent = "Текст вопроса скопирован — вставьте его в чат MAX."; }
    catch { tip.textContent = askText(it); }
    tip.hidden = false;
    window.open(MAX_LINK, "_blank", "noopener");
  }
});
grid.addEventListener("click", e => {
  const c = e.target.closest(".card[data-i]");
  if (c) openPart(Number(c.dataset.i));
});
grid.addEventListener("keydown", e => {
  const c = e.target.closest(".card[data-i]");
  if (c && e.key === "Enter") openPart(Number(c.dataset.i));
});
$("modalClose").addEventListener("click", () => modal.close());
modal.addEventListener("click", e => { if (e.target === modal) modal.close(); });

render();

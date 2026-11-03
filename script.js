const PHONE_LINK = "tel:+79147036933";
const PHONE_TEXT = "8 914 703-69-33";
const SMS_NUMBER = "+79147036933";
// Ссылка на мамин профиль в MAX. Если пусто — кнопка «Спросить в MAX» скрыта.
const MAX_LINK = "https://max.ru/u/f9LHodD0cOJmKBGLTE8lXDUSykXb1SczNsx1-aqDhf4wkixvPir5aSOru7w";

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
const money = n => n.toLocaleString("ru-RU") + " ₽";
// Артикул без пробелов, дефисов и точек — чтобы «KYB 334-505» нашлось как «334505»
const norm = s => String(s).toLowerCase().replace(/[\s\-./]/g, "");

// Иконки разделов (по порядку разделов в каталоге)
const svg = inner => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
const ICONS = [
  svg('<path d="M12 2v4M12 14v2M12 20v2"/><rect x="9" y="6" width="6" height="8" rx="1"/><rect x="10" y="16" width="4" height="4" rx="1"/>'),
  svg('<path d="M12 2v3"/><rect x="9.5" y="5" width="5" height="9" rx="1"/><path d="M12 14v3"/><path d="M8 17l8 2.5M8 19.5 16 22"/>'),
  svg('<path d="M7 3h10M7 21h10M7 6l10 2.5L7 11l10 2.5L7 16l10 2.5"/>'),
  svg('<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 4v2M12 18v2M4 12h2M18 12h2"/>'),
  svg('<path d="M8 4h8l-1 3 2 2-2 2 2 2-2 2 2 2-1 3H8l1-3-2-2 2-2-2-2 2-2-2-2z"/>'),
  svg('<circle cx="5" cy="12" r="2.5"/><circle cx="19" cy="12" r="2.5"/><path d="M7.5 12h9"/><path d="M12 9v6"/>'),
  svg('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2"/><path d="M12 3v7M5 17l5.5-3.5M19 17l-5.5-3.5"/>'),
  svg('<path d="M3 16c4-8 14-8 18 0"/><circle cx="3" cy="16" r="1.5"/><circle cx="21" cy="16" r="1.5"/>'),
  svg('<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2.5"/><path d="M16 5.5a8 8 0 0 1 2.5 6.5"/>'),
  svg('<path d="M4 5h16l-6 7v6l-4 2v-8z"/>'),
  svg('<circle cx="7" cy="12" r="3.5"/><circle cx="17" cy="12" r="3.5"/><path d="M7 8.5h10M7 15.5h10"/>'),
  svg('<rect x="4" y="8" width="16" height="10" rx="2"/><path d="M8 8V5h8v3M2 12h2M20 12h2"/>'),
  svg('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2"/>'),
  svg('<path d="M9 3h6v3l3 3v11a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V9l3-3z"/><path d="M6 12h12"/>'),
  svg('<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>'),
  svg('<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M9 9h6v6H9z"/>'),
];

// Кнопки «Написать в MAX» на странице появляются, только когда задана ссылка
if (MAX_LINK) document.querySelectorAll("[data-max]").forEach(el => { el.href = MAX_LINK; el.hidden = false; });

// Данные из прайсов: словари + строки [раздел, бренд#, артикул, название#, сторона#, применимость#, цена, распродажа, номера]
// Каталог грузится двумя частями: data/parts-1.js (главные разделы, сразу) и data/parts-2.js (остальное, следом).
// Бренды и стороны приходят целиком в первой части, названия и применимость — дополняются из второй.
const D = PARTS_DATA;
const PART_CATEGORIES = D.c, PARTS_UPDATED = D.u;
const L = arr => arr.map(s => s.toLowerCase());
const BRAND_L = L(D.b), SIDE_L = L(D.s), CAT_L = L(D.c);
const NAMES = [], FITS = [], NAME_L = [], FITS_L = [], FITS_U = [];
const MAIN_BRAND = D.b.map(b => /^(kyb|obk)$/i.test(b));

// Место установки (перед/зад, лев/прав) — для пары и аналогов
const placeOf = s => ({ front: /перед/i.test(s), rear: /зад/i.test(s), left: /лев/i.test(s), right: /прав/i.test(s) });
const SIDE_PLACE = D.s.map(placeOf);
// У KYB сторона часто в названии «(FR)» или в применимости «-- FR»: FR — перед прав, RL — зад лев
const CODE_PLACE = { FR: "перед прав", FL: "перед лев", RR: "зад прав", RL: "зад лев" };
const codePlace = re => s => placeOf(CODE_PLACE[(String(s).toUpperCase().match(re) || [])[1]] || "");
const mergePlace = (...ps) => ({ front: ps.some(p => p.front), rear: ps.some(p => p.rear), left: ps.some(p => p.left), right: ps.some(p => p.right) });
const nameRe = codePlace(/\((FR|FL|RR|RL)\)/), fitsRe = codePlace(/--\s*(FR|FL|RR|RL)\b/);
const NAME_PLACE = [], FITS_PLACE = [];

const ITEMS = [];
// Главное в магазине — амортизаторы, стойки и пружины: они первыми, внутри них сначала KYB и OBK
const MAIN_CATS = [0, 1, 2];
const isMainCat = it => MAIN_CATS.includes(it.cat);
let FULL = false; // догрузилась ли вторая часть каталога

// Добавить часть каталога: словари названий и применимости дополняются, товары — в общий список
function addParts(names, fits, rows) {
  names.forEach(n => { NAMES.push(n); NAME_L.push(n.toLowerCase()); NAME_PLACE.push(mergePlace(placeOf(n), nameRe(n))); });
  fits.forEach(f => {
    const l = f.toLowerCase();
    FITS.push(f); FITS_L.push(l); FITS_U.push(f.toUpperCase()); FITS_PLACE.push(fitsRe(f));
    FITS_CARS.push(CARS.filter(c => l.includes(c.toLowerCase()))); FITS_USE.push(0);
  });
  rows.forEach(r => {
    const it = {
      i: ITEMS.length, cat: r[0], bi: r[1], brand: D.b[r[1]], article: String(r[2]), ni: r[3], name: NAMES[r[3]],
      si: r[4], side: D.s[r[4]], fi: r[5], fits: FITS[r[5]], price: r[6], sale: r[7] === 1,
      extra: r[8], art: norm(r[2]), isMain: MAIN_BRAND[r[1]], place: mergePlace(SIDE_PLACE[r[4]], NAME_PLACE[r[3]], FITS_PLACE[r[5]]),
      cars: FITS_CARS[r[5]],
    };
    FITS_USE[it.fi]++;
    ITEMS.push(it);
  });
  ITEMS.sort((a, b) => (isMainCat(b) - isMainCat(a)) || (b.isMain - a.isMain) || a.cat - b.cat);
}

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
// Логотипы марок (images/cars): одноцветные, окрашиваются цветом текста кнопки
const CAR_LOGO = { Toyota: "toyota.svg", Nissan: "nissan.svg", Honda: "honda.svg", Mazda: "mazda.svg", Mitsubishi: "mitsubishi.svg",
  Subaru: "subaru.svg", Suzuki: "suzuki.svg", Lexus: "lexus.png", Daihatsu: "daihatsu.png", Isuzu: "isuzu.png", Hyundai: "hyundai.svg", Kia: "kia.svg" };
const carLogo = c => CAR_LOGO[c] ? `<span class="car-logo car-logo--${c.toLowerCase()}" style="--logo:url(images/cars/${CAR_LOGO[c]})" aria-hidden="true"></span>` : "";
// Марки по каждой строке применимости (считаем один раз на уникальную строку) и сколько товаров на строку
const FITS_CARS = [], FITS_USE = [];
addParts(D.n, D.f, D.p); // первая часть — сразу

// Модель ищем отдельным словом: «Fit» не находится в «FITS», а «RX» находится в «RX300»
const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const modelRe = m => new RegExp("(^|[^A-Z0-9])" + escRe(m.toUpperCase()).replace(/[-\s]/g, "[-\\s]?") + "(?![A-Z])");
// Какие строки применимости подходят модели — считаем, только когда выбрали марку (после догрузки — заново)
let MODEL_FITS = {}, MODEL_COUNT = {};
function modelData(m) {
  if (!MODEL_FITS[m]) {
    const re = modelRe(m), set = new Set();
    let n = 0;
    FITS_U.forEach((f, fi) => { if (f && re.test(f)) { set.add(fi); n += FITS_USE[fi]; } });
    MODEL_FITS[m] = set; MODEL_COUNT[m] = n;
  }
  return MODEL_FITS[m];
}

const samePlace = (a, b) =>
  (!(a.front || a.rear) || !(b.front || b.rear) || (a.front && b.front) || (a.rear && b.rear)) &&
  (!(a.left || a.right) || !(b.left || b.right) || (a.left && b.left) || (a.right && b.right));
// Коды кузова из применимости (ACV40, GX81, ZRE152…) — по ним ищем аналоги других брендов
const NOT_CODES = /^(2WD|4WD|AWD|4X4|4X2|\d+V|\d+MM|\d+L)$/;
const CODES = [];
const codesOf = fi => CODES[fi] || (CODES[fi] = new Set((FITS_U[fi].match(/[A-Z0-9]+(?:-[A-Z0-9]+)?/g) || [])
  .filter(c => c.length >= 3 && /\d/.test(c) && /[A-Z]/.test(c) && !NOT_CODES.test(c))));
// Применимость без пометок стороны («-- FR», «LH»), чтобы левая и правая совпали
const BASE = [];
const baseOf = fi => BASE[fi] ?? (BASE[fi] = FITS_U[fi].replace(/--\s*(FR|FL|RR|RL|F|R)\b/g, "").replace(/\b(LH|RH|LEFT|RIGHT|FRONT|REAR)\b/g, "").replace(/\s+/g, " ").trim());

const PAGE = 30;
const state = { cat: null, car: "", model: "", brand: "", sale: false, query: "", shown: PAGE };
const CAR_KEY = "ap-car";
function rememberCar() {
  try { state.car ? localStorage.setItem(CAR_KEY, JSON.stringify({ car: state.car, model: state.model })) : localStorage.removeItem(CAR_KEY); } catch { /* без памяти */ }
}

const $ = id => document.getElementById(id);
const grid = $("productGrid"), count = $("catalogCount"), empty = $("emptyState"), moreBtn = $("moreBtn");
const searchInput = $("searchInput"), brandInput = $("brandInput");
// Итоговые цифры всего каталога приходят в первой части — показываем их сразу
const SALE_COUNT = D.sale ?? ITEMS.filter(it => it.sale).length;

// Цифры в шапке
document.querySelectorAll("[data-total]").forEach(el => el.textContent = (D.total ?? ITEMS.length).toLocaleString("ru-RU"));
document.querySelectorAll("[data-brands]").forEach(el => el.textContent = (D.brands ?? D.b.length) - 2);
document.querySelectorAll("[data-updated]").forEach(el => el.textContent = PARTS_UPDATED);

// Бренды в выпадающем списке: KYB и OBK первыми, дальше по количеству (после догрузки — пересчёт)
let brandCount = {}, brandOrder = [];
function countBrands() {
  brandCount = {};
  ITEMS.forEach(it => { brandCount[it.brand] = (brandCount[it.brand] || 0) + 1; });
  brandOrder = Object.keys(brandCount).sort((a, b) =>
    (/^(kyb|obk)$/i.test(b) - /^(kyb|obk)$/i.test(a)) || brandCount[b] - brandCount[a]);
}
countBrands();

// Подсказки при вводе: список под полем, выбор пальцем или мышкой
function suggest(input, list, getItems, onPick) {
  let items = [];
  const show = () => {
    items = getItems(input.value.trim().toLowerCase());
    list.innerHTML = items.map((it, n) => `<button type="button" class="suggest__item" data-n="${n}">
      ${it.group ? `<small class="suggest__group">${escapeHtml(it.group)}</small>` : ""}
      <span>${escapeHtml(it.label)}</span>${it.count != null ? `<small>${it.count.toLocaleString("ru-RU")}</small>` : ""}</button>`).join("");
    list.hidden = !items.length;
  };
  input.addEventListener("input", show);
  input.addEventListener("focus", show);
  // mousedown срабатывает раньше, чем поле теряет фокус, — выбор не теряется
  list.addEventListener("mousedown", e => e.preventDefault());
  list.addEventListener("click", e => {
    const b = e.target.closest("[data-n]");
    if (!b) return;
    list.hidden = true;
    onPick(items[Number(b.dataset.n)]);
  });
  input.addEventListener("blur", () => setTimeout(() => { list.hidden = true; }, 150));
  input.addEventListener("keydown", e => { if (e.key === "Escape") list.hidden = true; });
}

// Бренд: вводите часть названия — сайт предлагает подходящие (KYB и OBK первыми)
suggest(brandInput, $("brandList"), q => {
  const inCat = catInfo().brands; // только бренды, которые есть в выбранном разделе
  const found = brandOrder.filter(b => inCat[b] && (!q || b.toLowerCase().includes(q)))
    .sort((a, b) => (q ? (b.toLowerCase().startsWith(q) - a.toLowerCase().startsWith(q)) : 0));
  return [{ label: "Все бренды", value: "" }, ...found.slice(0, 40).map(b => ({ label: b, value: b, count: inCat[b] }))];
}, it => {
  state.brand = it.value;
  brandInput.value = it.value;
  brandInput.blur();
  reset();
});
brandInput.addEventListener("search", () => { if (!brandInput.value && state.brand) { state.brand = ""; reset(); } });

// Каждое слово запроса должно найтись хоть где-то: бренд, артикул, название, сторона, машина, раздел, номера
function hasWord(it, w) {
  return NAME_L[it.ni].includes(w) || BRAND_L[it.bi].includes(w) || it.art.includes(w) || FITS_L[it.fi].includes(w) ||
    SIDE_L[it.si].includes(w) || CAT_L[it.cat].includes(w) || it.extra.toLowerCase().includes(w);
}

function filtered() {
  const words = state.query.toLowerCase().split(/\s+/).filter(Boolean);
  const compact = norm(state.query);
  const modelSet = state.model ? modelData(state.model) : null;
  return ITEMS.filter(it => {
    if (state.cat !== null && it.cat !== state.cat) return false;
    if (state.sale && !it.sale) return false;
    if (modelSet) { if (!modelSet.has(it.fi)) return false; }
    else if (state.car && !it.cars.includes(state.car)) return false;
    if (state.brand && it.brand !== state.brand) return false;
    if (!words.length) return true;
    return words.every(w => hasWord(it, w)) ||
      (compact.length >= 3 && (it.art.includes(compact) || it.extra.toLowerCase().includes(compact)));
  });
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
    <div class="part__badges"><span class="badge badge--stock">В наличии</span>${it.sale ? '<span class="badge badge--sale">Распродажа</span>' : ""}</div>
    <div class="card__price">${money(it.price)}</div>
  </article>`;
}

// Что есть в выбранном разделе (и распродаже): марки, бренды, модели — чтобы не предлагать пустые фильтры
const CAT_INFO = new Map();
function catInfo() {
  const key = state.cat + "|" + state.sale;
  if (!CAT_INFO.has(key)) {
    const items = ITEMS.filter(it => (state.cat === null || it.cat === state.cat) && (!state.sale || it.sale));
    const cars = new Set(), brands = {};
    items.forEach(it => { it.cars.forEach(c => cars.add(c)); brands[it.brand] = (brands[it.brand] || 0) + 1; });
    CAT_INFO.set(key, { items, cars, brands, models: {} });
  }
  return CAT_INFO.get(key);
}

function renderChips() {
  $("categoryChips").innerHTML =
    `<button class="chip ${state.cat === null && !state.sale ? "is-active" : ""}" data-cat="">Все разделы</button>` +
    (SALE_COUNT ? `<button class="chip chip--sale ${state.sale ? "is-active" : ""}" data-sale>Распродажа (${SALE_COUNT})</button>` : "") +
    PART_CATEGORIES.map((c, n) => `<button class="chip${MAIN_CATS.includes(n) ? " chip--main" : ""} ${state.cat === n ? "is-active" : ""}" data-cat="${n}">${escapeHtml(c)}</button>`).join("");
  // Марки, модели и бренд — только те, что есть в выбранном разделе; иначе выбор сбрасывается
  const info = catInfo();
  const cars = CARS.filter(c => info.cars.has(c));
  if (state.car && !cars.includes(state.car)) { state.car = ""; state.model = ""; }
  if (state.brand && !info.brands[state.brand]) state.brand = "";
  $("carChips").hidden = !cars.length;
  $("carChips").innerHTML = `<span class="chips__label">Машина:</span>` +
    ["", ...cars].map(c => `<button class="chip chip--small chip--car ${state.car === c ? "is-active" : ""}" data-car="${c}">${carLogo(c)}${c || "Любая"}</button>`).join("");
  const modelCount = m => info.models[m] ?? (info.models[m] = info.items.filter(it => modelData(m).has(it.fi)).length);
  const models = state.car ? MODELS[state.car].filter(m => modelCount(m) > 0) : [];
  if (state.model && !models.includes(state.model)) state.model = "";
  $("modelRow").hidden = !models.length;
  $("modelSelect").innerHTML = `<option value="">Все модели ${state.car}</option>` +
    models.map(m => `<option value="${m}"${state.model === m ? " selected" : ""}>${m} (${modelCount(m)})</option>`).join("");
  if (document.activeElement !== brandInput) brandInput.value = state.brand;
}

function render() {
  renderChips();
  const list = filtered();
  $("catalogTitle").textContent = (state.sale ? "Распродажа" : state.cat === null ? "Каталог" : PART_CATEGORIES[state.cat]) +
    (state.model ? ` для ${state.car} ${state.model}` : state.car ? ` для ${state.car}` : "");
  // Пока вторая часть каталога в пути — честно пишем, что догружаем, и не говорим «ничего не нашлось»
  const partial = !FULL && !(state.cat !== null && MAIN_CATS.includes(state.cat));
  count.textContent = list.length
    ? `Найдено: ${list.length.toLocaleString("ru-RU")}${partial ? " · загружаем весь каталог…" : ""}`
    : partial ? "Загружаем весь каталог…" : "";
  empty.hidden = list.length > 0 || partial;
  grid.innerHTML = list.slice(0, state.shown).map(card).join("");
  const left = list.length - state.shown;
  moreBtn.hidden = left <= 0;
  moreBtn.textContent = `Показать ещё (${left.toLocaleString("ru-RU")})`;
}

const reset = () => { state.shown = PAGE; render(); };
const toCatalog = () => $("catalog").scrollIntoView({ behavior: "smooth" });

// Плитки разделов на первом экране
let catCount = PART_CATEGORIES.map((_, n) => ITEMS.filter(it => it.cat === n).length);
// Главные разделы — большие карточки с брендами, остальное — обычные плитки ниже
const topBrands = n => {
  const c = {};
  ITEMS.forEach(it => { if (it.cat === n) c[it.brand] = (c[it.brand] || 0) + 1; });
  const order = Object.keys(c).sort((a, b) => (/^(kyb|obk)$/i.test(b) - /^(kyb|obk)$/i.test(a)) || c[b] - c[a]);
  return order.slice(0, 3).join(", ");
};
// Фото разделов (деталь без фона, images/cat/NN.webp); где фото нет — значок
const CAT_PHOTOS = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
const tileMedia = n => CAT_PHOTOS.includes(n)
  ? `<span class="tile__media"><img src="images/cat/${String(n).padStart(2, "0")}.webp" alt="" width="520" height="520" loading="lazy"></span>`
  : `<span class="tile__media"><span class="tile__icon">${ICONS[n]}</span></span>`;
const tile = n => `
  <button class="tile" data-cat="${n}">
    ${tileMedia(n)}
    <span>${escapeHtml(PART_CATEGORIES[n])}</span>
  </button>`;
$("tiles").innerHTML = `
  <p class="tiles__label">Наша специализация</p>
  <div class="tiles__main">${MAIN_CATS.map(n => `
    <button class="tile tile--main" data-cat="${n}">
      <span class="tile__thumb${n === 2 ? " tile__thumb--photo" : ""}"><img src="images/cat/${String(n).padStart(2, "0")}.webp" alt="" width="520" height="520"></span>
      <span class="tile--main__text">
        <span class="tile--main__title">${escapeHtml(PART_CATEGORIES[n])}</span>
        <span class="tile--main__brands">${escapeHtml(topBrands(n))}</span>
        <span class="tile--main__count">${catCount[n].toLocaleString("ru-RU")} шт. →</span>
      </span>
    </button>`).join("")}</div>
  <p class="tiles__label tiles__label--other">Другие запчасти</p>
  <div class="tiles__other">${PART_CATEGORIES.map((_, n) => n).filter(n => !MAIN_CATS.includes(n)).map(tile).join("")}</div>`;
$("tiles").addEventListener("click", e => {
  const t = e.target.closest(".tile");
  if (!t) return;
  state.cat = Number(t.dataset.cat);
  state.sale = false;
  reset();
  toCatalog();
});

$("categoryChips").addEventListener("click", e => {
  if (e.target.closest("[data-sale]")) { state.sale = !state.sale; state.cat = null; reset(); return; }
  const b = e.target.closest("[data-cat]");
  if (!b) return;
  state.cat = b.dataset.cat === "" ? null : Number(b.dataset.cat);
  state.sale = false;
  reset();
});
$("carChips").addEventListener("click", e => {
  const b = e.target.closest("[data-car]");
  if (!b) return;
  state.car = b.dataset.car;
  state.model = "";
  rememberCar();
  reset();
});
$("modelSelect").addEventListener("change", e => { state.model = e.target.value; rememberCar(); reset(); });
brandInput.addEventListener("input", () => { if (!brandInput.value && state.brand) { state.brand = ""; reset(); } });

// Главный поиск: подсказки — разделы, бренды и машины, которые подходят к введённому
const ALL_MODELS = CARS.flatMap(c => MODELS[c].map(m => ({ car: c, model: m })));
suggest(searchInput, $("searchList"), q => {
  if (q.length < 2) return [];
  const out = [];
  PART_CATEGORIES.forEach((c, n) => { if (c.toLowerCase().includes(q)) out.push({ group: "Раздел", label: c, count: catCount[n], cat: n }); });
  brandOrder.filter(b => b.toLowerCase().startsWith(q)).slice(0, 4)
    .forEach(b => out.push({ group: "Бренд", label: b, count: brandCount[b], brand: b }));
  CARS.filter(c => c.toLowerCase().startsWith(q)).forEach(c => out.push({ group: "Марка", label: c, car: c }));
  ALL_MODELS.filter(x => x.model.toLowerCase().startsWith(q)).slice(0, 4)
    .forEach(x => out.push({ group: "Машина", label: `${x.car} ${x.model}`, car: x.car, model: x.model }));
  return out.slice(0, 8);
}, it => {
  // Выбор из подсказки — новый поиск: старые фильтры сбрасываем, ставим только выбранный
  clearTimeout(typing);
  Object.assign(state, { cat: null, car: "", model: "", brand: "", sale: false });
  if (it.cat != null) state.cat = it.cat;
  if (it.brand) state.brand = it.brand;
  if (it.car) { state.car = it.car; state.model = it.model || ""; rememberCar(); }
  state.query = "";
  searchInput.value = "";
  searchInput.blur();
  reset();
  toCatalog();
});

$("searchForm").addEventListener("submit", e => {
  e.preventDefault();
  clearTimeout(typing);
  state.query = searchInput.value;
  searchInput.blur(); // спрятать клавиатуру телефона, чтобы она не закрывала результаты
  reset();
  toCatalog();
});
let typing;
searchInput.addEventListener("input", () => {
  clearTimeout(typing);
  typing = setTimeout(() => { state.query = searchInput.value; reset(); }, 250);
});
moreBtn.addEventListener("click", () => {
  const was = grid.children.length;
  state.shown += PAGE;
  render();
  // Уже показанные карточки не анимируем заново — появляются только новые
  [...grid.children].slice(0, was).forEach(c => { c.style.animation = "none"; });
});

// Окно товара
const modal = $("productModal"), modalBody = $("modalBody");
let currentPart = null;
const byIndex = i => ITEMS.find(x => x.i === i);
function openPart(i) {
  const it = byIndex(i);
  if (!it) return;
  currentPart = i;
  const rows = [
    ["Раздел", PART_CATEGORIES[it.cat]],
    ["Бренд", it.brand],
    ["Артикул", it.article],
    ["Установка", it.side],
    ["Подходит", it.fits],
    ["Номера замен", it.extra.split(" ").filter(Boolean).join(", ")],
  ].filter(([, v]) => v);
  modalBody.innerHTML = `
    <div class="modal__img modal__img--icon">${ICONS[it.cat]}</div>
    <div class="modal__body">
      <h2>${escapeHtml(it.name)}</h2>
      <table class="specs">${rows.map(([k, v]) => `<tr><td>${k}</td><td>${escapeHtml(v)}</td></tr>`).join("")}</table>
      <div class="modal__price">${money(it.price)}${it.sale ? ' <span class="badge badge--sale">Распродажа</span>' : ""}</div>
      <p class="modal__note"><span class="badge badge--stock">В наличии</span> Цена по прайсу от ${PARTS_UPDATED}.</p>
      <p class="modal__hint">Перед заказом пришлите полный номер кузова — проверим, что деталь подойдёт. Отправляем по России, до ТК — 300 ₽.</p>
      ${pairBlock(it)}
      <div class="ask">
        <button class="btn btn--list${inList(it) ? " is-added" : ""}" data-list>${listBtnText(it)}</button>
        <a class="btn btn--call btn--big" href="${PHONE_LINK}">Позвонить: ${PHONE_TEXT}</a>
        ${MAX_LINK ? `<button class="btn btn--max" data-ask-max>Спросить в MAX</button>` : ""}
        <a class="btn btn--ghost" href="sms:${SMS_NUMBER}?&body=${encodeURIComponent(askText(it))}">Спросить по СМС</a>
        <button class="btn btn--ghost" data-copy>Скопировать артикул</button>
        <button class="btn btn--ghost" data-share>Поделиться ссылкой на товар</button>
      </div>
      <p class="ask__tip" id="askTip" hidden></p>
      ${related("Для этой же машины", sameCar(it), "Тот же бренд и та же машина — например, вторая сторона, чтобы поменять парой.")}
      ${related("Аналоги других брендов", analogs(it), "Подобраны по коду кузова и месту установки. Точную совместимость сверим по телефону.")}
    </div>`;
  history.replaceState(null, "", "#t=" + encodeURIComponent(partKey(it)));
  if (!modal.open) modal.showModal();
  modal.scrollTop = 0;
}

// Своя ссылка у каждого товара: бренд + артикул (не меняются при обновлении прайса)
const partKey = it => it.brand + "~" + it.article;
const BY_KEY = new Map();
const indexKeys = () => ITEMS.forEach(it => BY_KEY.set(partKey(it), it));
indexKeys();
function openFromLink() {
  const m = location.hash.match(/^#t=(.+)/);
  let key = "";
  try { key = m ? decodeURIComponent(m[1]) : ""; } catch { key = ""; } // кривая ссылка — просто не открываем товар
  const it = key && BY_KEY.get(key);
  if (it) openPart(it.i);
}
// Окно закрыли — убираем товар из адреса страницы
modal.addEventListener("close", () => history.replaceState(null, "", location.pathname + location.search));

// Амортизаторы, стойки и пружины меняют парой: показываем цену за пару и вторую сторону
const PAIR_CATS = { 0: "Амортизаторы", 1: "Стойки", 2: "Пружины" };
function pairOf(it) {
  if (!it.fits || !(it.place.left || it.place.right)) return null;
  const base = baseOf(it.fi), p = it.place;
  return ITEMS.filter(x => x !== it && x.bi === it.bi && x.cat === it.cat &&
    x.place.left === p.right && x.place.right === p.left && x.place.front === p.front && x.place.rear === p.rear &&
    baseOf(x.fi) === base).sort((a, b) => a.price - b.price)[0] || null;
}
function pairBlock(it) {
  const what = PAIR_CATS[it.cat];
  if (!what) return "";
  const other = pairOf(it);
  if (other) return `<div class="pair">
      <p><b>${what} меняют парой</b> — левый и правый на одной оси.</p>
      <p>Вторая сторона: <button class="pair__link" data-open="${other.i}">${escapeHtml(other.brand)} ${escapeHtml(other.article)}</button>
        ${other.side ? `<span class="part__side">${escapeHtml(other.side)}</span>` : ""} — ${money(other.price)}</p>
      <p class="pair__sum">Цена за пару: <b>${money(it.price + other.price)}</b></p>
      <button class="btn btn--ghost" data-list-pair="${other.i}">Добавить пару в список</button>
    </div>`;
  if (it.place.left || it.place.right) return `<div class="pair">
      <p><b>${what} меняют парой</b> — вторую сторону подберём по телефону.</p></div>`;
  return `<div class="pair">
      <p><b>${what} меняют парой</b> — на обе стороны одной оси.</p>
      <p class="pair__sum">Цена за пару (2 шт.): <b>${money(it.price * 2)}</b></p>
      <button class="btn btn--ghost" data-list-two>Добавить 2 шт. в список</button>
    </div>`;
}

// Список запроса: клиент собирает детали и одним сообщением отправляет маме.
// Хранится только в браузере клиента (бренд, артикул, количество).
const LIST_KEY = "ap-list";
let wish = [];
try { wish = JSON.parse(localStorage.getItem(LIST_KEY)) || []; } catch { wish = []; }
// Пока каталог не догрузился, товары из других разделов ещё не известны — их не выбрасываем, а ждём
wish = wish.filter(w => w && typeof w.k === "string" && w.q > 0);
const inList = it => wish.find(w => w.k === partKey(it));
const listBtnText = it => inList(it) ? "✓ В списке — открыть список" : "Добавить в список запроса";
function saveList() {
  try { localStorage.setItem(LIST_KEY, JSON.stringify(wish)); } catch { /* приватный режим — список живёт до закрытия страницы */ }
  renderList();
}
function addToList(it, q = 1) {
  const w = inList(it);
  if (w) w.q = Math.max(w.q, q); else wish.push({ k: partKey(it), q });
  saveList();
}
const listModal = $("listModal"), listBody = $("listBody"), listFab = $("listFab");
const listRows = () => wish.map(w => ({ ...w, it: BY_KEY.get(w.k) })).filter(r => r.it); // ещё не догруженные — пока не показываем
const listTotal = () => listRows().reduce((s, r) => s + r.it.price * r.q, 0);
function listText() {
  const lines = listRows().map((r, n) => `${n + 1}. ${r.it.brand} ${r.it.article} — ${r.it.name}${r.it.side ? " (" + r.it.side + ")" : ""} — ${r.q} шт. × ${money(r.it.price)}`);
  return `Здравствуйте! Хочу заказать / уточнить наличие:\n${lines.join("\n")}\nИтого по сайту: ${money(listTotal())}\nНомер кузова моей машины: \nСписок с сайта «Амортизаторы-Пружины».`;
}
function renderList() {
  const n = wish.reduce((s, w) => s + w.q, 0);
  listFab.hidden = !wish.length;
  $("listCount").textContent = n;
  if (!listModal.open) return;
  if (!wish.length) {
    listBody.innerHTML = `<h2>Список запроса</h2><p class="list__empty">Список пуст. Откройте товар и нажмите «Добавить в список запроса».</p>`;
    return;
  }
  listBody.innerHTML = `
    <h2>Список запроса</h2>
    <p class="related__hint">Отправьте список в MAX или по СМС — проверим наличие и ответим.</p>
    <div class="list">${listRows().map(r => `
      <div class="list__row">
        <button class="list__name" data-open-part="${r.it.i}"><b>${escapeHtml(r.it.brand)} ${escapeHtml(r.it.article)}</b>
          <span>${escapeHtml(r.it.name)}${r.it.side ? ` <span class="part__side">${escapeHtml(r.it.side)}</span>` : ""}</span></button>
        <div class="list__qty">
          <button data-minus="${escapeHtml(r.k)}" aria-label="Меньше">−</button><span>${r.q}</span><button data-plus="${escapeHtml(r.k)}" aria-label="Больше">+</button>
        </div>
        <span class="list__price">${money(r.it.price * r.q)}</span>
        <button class="list__del" data-del="${escapeHtml(r.k)}" aria-label="Убрать из списка">×</button>
      </div>`).join("")}
    </div>
    <p class="list__total">Итого: <b>${money(listTotal())}</b></p>
    <div class="ask">
      ${MAX_LINK ? `<button class="btn btn--max btn--big" data-list-max>Отправить список в MAX</button>` : ""}
      <a class="btn btn--ghost" href="sms:${SMS_NUMBER}?&body=${encodeURIComponent(listText())}">Отправить по СМС</a>
      <button class="btn btn--ghost" data-list-copy>Скопировать список</button>
      <a class="btn btn--call" href="${PHONE_LINK}">Позвонить: ${PHONE_TEXT}</a>
      <button class="btn btn--ghost list__clear" data-list-clear>Очистить список</button>
    </div>
    <p class="ask__tip" id="listTip" hidden></p>`;
}
function openList() {
  if (modal.open) modal.close();
  listModal.showModal();
  renderList();
}
listFab.addEventListener("click", openList);
$("listClose").addEventListener("click", () => listModal.close());
listModal.addEventListener("click", async e => {
  if (e.target === listModal) { listModal.close(); return; }
  const t = e.target.closest("button");
  if (!t) return;
  const find = k => wish.find(w => w.k === k);
  if (t.dataset.plus) { find(t.dataset.plus).q++; saveList(); }
  else if (t.dataset.minus) { const w = find(t.dataset.minus); if (w.q > 1) { w.q--; saveList(); } }
  else if (t.dataset.del) { wish = wish.filter(w => w.k !== t.dataset.del); saveList(); }
  else if (t.dataset.openPart) { listModal.close(); openPart(Number(t.dataset.openPart)); }
  else if ("listClear" in t.dataset) { if (confirm("Очистить список?")) { wish = []; saveList(); } }
  else if ("listCopy" in t.dataset || "listMax" in t.dataset) {
    const tip = $("listTip");
    try { await navigator.clipboard.writeText(listText()); tip.textContent = "listMax" in t.dataset ? "Список скопирован — вставьте его в чат MAX." : "Список скопирован."; }
    catch { tip.textContent = listText(); }
    tip.hidden = false;
    if ("listMax" in t.dataset) window.open(MAX_LINK, "_blank", "noopener");
  }
});
renderList();

// Текст вопроса маме — сразу с брендом, артикулом и названием
const askText = it => `Здравствуйте! Есть в наличии ${it.brand} ${it.article} — ${it.name}${it.side ? " (" + it.side + ")" : ""}? Нашёл на сайте «Амортизаторы-Пружины». Номер кузова моей машины: `;

// Для той же машины: тот же бренд и та же применимость (пара, пружины, опоры…)
function sameCar(it) {
  if (!it.fits) return [];
  const base = baseOf(it.fi);
  return ITEMS.filter(x => x !== it && x.bi === it.bi && x.fits && (x.fi === it.fi || baseOf(x.fi) === base))
    .sort((a, b) => a.cat - b.cat || a.price - b.price).slice(0, 6);
}

// Аналоги: другой бренд, тот же раздел и место установки, общий код кузова
function analogs(it) {
  if (!it.fits) return [];
  const mine = codesOf(it.fi);
  if (!mine.size) return [];
  return ITEMS.filter(x => x.bi !== it.bi && x.cat === it.cat && x.fits && samePlace(x.place, it.place) && [...codesOf(x.fi)].some(c => mine.has(c)))
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
  const it = byIndex(currentPart);
  const tip = $("askTip");
  const listBtn = modalBody.querySelector("[data-list]");
  const added = text => { tip.textContent = text; tip.hidden = false; listBtn.textContent = listBtnText(it); listBtn.classList.add("is-added"); };
  if (e.target.closest("[data-list]")) {
    if (inList(it)) { openList(); return; }
    addToList(it);
    added("Добавлено в список. Кнопка «Список» — внизу экрана.");
  }
  const pairBtn = e.target.closest("[data-list-pair]");
  if (pairBtn) {
    addToList(it);
    addToList(byIndex(Number(pairBtn.dataset.listPair)));
    added("Пара добавлена в список.");
  }
  if (e.target.closest("[data-list-two]")) {
    addToList(it, 2);
    added("2 шт. добавлены в список.");
  }
  if (e.target.closest("[data-share]")) {
    const url = location.href, title = `${it.brand} ${it.article} — ${it.name}`;
    if (navigator.share) {
      try { await navigator.share({ title, url }); return; } catch (err) { if (err.name === "AbortError") return; }
    }
    try { await navigator.clipboard.writeText(url); tip.textContent = "Ссылка на товар скопирована — отправьте её в MAX или СМС."; }
    catch { tip.textContent = url; }
    tip.hidden = false;
  }
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

// Пришли со страницы раздела или марки (?razdel=amortizatory&marka=Toyota&model=Camry) — сразу ставим фильтры
// Порядок должен совпадать с CAT_SLUGS в заметки/seo_stranicy.py
const CAT_SLUGS = ["amortizatory", "stoyki", "pruzhiny", "opory", "pylniki", "rychagi", "rulevoe", "stabilizator",
  "tormoza", "filtry", "remni", "dvigatel", "stupicy", "masla", "elektrika", "prochee"];
const params = new URLSearchParams(location.search);
const fromSlug = CAT_SLUGS.indexOf(params.get("razdel"));
if (fromSlug >= 0) state.cat = fromSlug;
if (CARS.includes(params.get("marka"))) {
  state.car = params.get("marka");
  if ((MODELS[state.car] || []).includes(params.get("model"))) state.model = params.get("model");
}

// Машина покупателя запоминается в его браузере: в следующий раз каталог сразу для неё
if (!params.has("razdel") && !params.has("marka")) {
  try {
    const saved = JSON.parse(localStorage.getItem(CAR_KEY) || "null");
    if (saved && CARS.includes(saved.car)) {
      state.car = saved.car;
      if ((MODELS[saved.car] || []).includes(saved.model)) state.model = saved.model;
    }
  } catch { /* приватный режим — просто без памяти */ }
}

render();
openFromLink();
window.addEventListener("hashchange", openFromLink);

// «Сейчас открыто / закрыто» — по времени Находки (UTC+10). Дни работы уточнить у мамы; пока — каждый день.
const HOURS = { open: 10, close: 15, days: [0, 1, 2, 3, 4, 5, 6] };
const DAY_NAMES = ["в воскресенье", "в понедельник", "во вторник", "в среду", "в четверг", "в пятницу", "в субботу"];
function openStatus() {
  const now = new Date(Date.now() + 10 * 3600e3); // часы Находки в UTC-полях
  const day = now.getUTCDay(), h = now.getUTCHours() + now.getUTCMinutes() / 60;
  if (HOURS.days.includes(day) && h >= HOURS.open && h < HOURS.close) return [true, `Сейчас открыто · до ${HOURS.close}:00`];
  let add = HOURS.days.includes(day) && h < HOURS.open ? 0 : 1;
  while (!HOURS.days.includes((day + add) % 7) && add < 7) add++;
  const when = add === 0 ? "сегодня" : add === 1 ? "завтра" : DAY_NAMES[(day + add) % 7];
  return [false, `Сейчас закрыто · откроемся ${when} в ${HOURS.open}:00`];
}
function showOpenStatus() {
  const [open, text] = openStatus();
  document.querySelectorAll("[data-open-status]").forEach(el => { el.textContent = text; el.classList.toggle("is-open", open); el.hidden = false; });
}
showOpenStatus();
setInterval(showOpenStatus, 60 * 1000);

// Вторая часть каталога: догружаем после показа страницы, потом всё пересчитываем и перерисовываем
window.addPartsChunk = chunk => {
  addParts(chunk.n, chunk.f, chunk.p);
  FULL = true;
  MODEL_FITS = {}; MODEL_COUNT = {}; CAT_INFO.clear();
  catCount = PART_CATEGORIES.map((_, n) => ITEMS.filter(it => it.cat === n).length);
  countBrands(); indexKeys();
  wish = wish.filter(w => BY_KEY.has(w.k)); saveList(); // теперь ясно, каких товаров из списка больше нет
  render();
  [...grid.children].forEach(c => { c.style.animation = "none"; }); // без повторной анимации уже видимых карточек
  if (!modal.open) openFromLink();
};
const rest = document.createElement("script");
rest.src = `data/parts-2.js?v=${D.v || ""}`;
rest.onerror = () => { count.textContent = "Не удалось загрузить весь каталог — обновите страницу."; };
document.body.append(rest);

// Шапка с анимацией белая только над светлым каталогом; над тёмным верхом и тёмным низом — снова тёмная
const header = document.querySelector(".header");
const lightFrom = document.getElementById("catalog"), darkFrom = document.querySelector(".stats");
if (header && lightFrom && darkFrom) {
  let ticking = false;
  const update = () => {
    ticking = false;
    const y = header.offsetHeight;
    header.classList.toggle("header--light", lightFrom.getBoundingClientRect().top < y && darkFrom.getBoundingClientRect().top > y);
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", onScroll);
  update();
}

// Анимация: блоки ниже каталога плавно появляются при прокрутке (как на папином сайте)
if ("IntersectionObserver" in window && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
  }), { rootMargin: "0px 0px -8% 0px" });
  document.querySelectorAll(".stats__item, .request__box, .reviews-block__score, .reviews-block__item, .terms h2, .terms__check, .terms__item, .about h2, .about__photo, .about__item, .footer__grid > div")
    .forEach((el, n) => { el.classList.add("reveal"); el.style.setProperty("--d", (n % 4) * 70 + "ms"); io.observe(el); });
}

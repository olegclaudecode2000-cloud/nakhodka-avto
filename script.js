const PHONE_LINK = "tel:+79147036933";
const PHONE_TEXT = "8 914 703-69-33";

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

const CARS = ["Toyota", "Nissan", "Honda", "Mazda", "Mitsubishi", "Subaru", "Suzuki", "Lexus", "Daihatsu", "Isuzu", "Hyundai", "Kia"];
const carOf = it => CARS.filter(c => it.fits.toLowerCase().includes(c.toLowerCase()));
ITEMS.forEach(it => { it.cars = carOf(it); });

const PAGE = 30;
const state = { cat: null, car: "", brand: "", query: "", shown: PAGE };

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
  if (state.car && !it.cars.includes(state.car)) return false;
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
  brandSelect.value = state.brand;
}

function render() {
  renderChips();
  const list = filtered();
  $("catalogTitle").textContent = state.cat === null ? "Каталог" : PART_CATEGORIES[state.cat];
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
  reset();
});
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
function openPart(i) {
  const it = ITEMS.find(x => x.i === i);
  if (!it) return;
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
      <a class="btn btn--call btn--big" href="${PHONE_LINK}">Позвонить: ${PHONE_TEXT}</a>
    </div>`;
  modal.showModal();
}
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

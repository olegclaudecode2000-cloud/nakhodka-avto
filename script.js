const PHONE_LINK = "tel:+79147036933";
const PHONE_TEXT = "8 914 703-69-33";

// Иконки категорий (рисунки вместо фото, пока фото нет)
const svg = inner => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
const CATEGORY_ICONS = {
  "Пружины": svg('<path d="M7 3h10M7 21h10M7 6l10 2.5L7 11l10 2.5L7 16l10 2.5"/>'),
  "Амортизаторы": svg('<path d="M12 2v4M12 14v2M12 20v2"/><rect x="9" y="6" width="6" height="8" rx="1"/><rect x="10" y="16" width="4" height="4" rx="1"/>'),
  "Автожидкости": svg('<path d="M12 3s6 6.8 6 11a6 6 0 0 1-12 0c0-4.2 6-11 6-11z"/>'),
  "Расходники": svg('<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.9 4.9 7 7M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1"/>'),
  "Магнитолы": svg('<rect x="2" y="7" width="20" height="10" rx="2"/><circle cx="7" cy="12" r="2"/><path d="M12 10h7M12 14h5"/>'),
  "Колонки": svg('<rect x="5" y="2" width="14" height="20" rx="2"/><circle cx="12" cy="14" r="4"/><circle cx="12" cy="6.5" r="1.3"/>'),
  "Сабвуферы": svg('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>'),
  "Усилители": svg('<rect x="3" y="6" width="18" height="11" rx="1.5"/><path d="M7 10v3M10 9v5M13 10.5v2M16 9.5v4M6 17v2M18 17v2"/>'),
  "Аксессуары": svg('<path d="M9 2v5M15 2v5"/><path d="M7 7h10v3a5 5 0 0 1-10 0z"/><path d="M12 15v7"/>'),
};
const iconFor = category => CATEGORY_ICONS[category] || CATEGORY_ICONS["Расходники"];
// Фото товара, а если его нет — иконка категории
const pictureFor = p => p.image
  ? `<img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" loading="lazy">`
  : iconFor(p.category);

const state = { section: "all", category: null, query: "" };

const grid = document.getElementById("productGrid");
const chips = document.getElementById("categoryChips");
const count = document.getElementById("catalogCount");
const empty = document.getElementById("emptyState");
const title = document.getElementById("catalogTitle");
const searchInput = document.getElementById("searchInput");
const modal = document.getElementById("productModal");
const modalBody = document.getElementById("modalBody");

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function priceText(p) {
  return p.price ? p.price.toLocaleString("ru-RU") + " ₽" : "Цена по запросу";
}

function badges(p) {
  const out = [];
  out.push(p.inStock
    ? '<span class="badge badge--stock">В наличии</span>'
    : '<span class="badge badge--out">Под заказ</span>');
  out.push(p.condition === "used"
    ? '<span class="badge badge--used">Б/у</span>'
    : '<span class="badge">Новый</span>');
  return out.join("");
}

function filtered() {
  const q = state.query.trim().toLowerCase();
  return PRODUCTS.filter(p => {
    if (state.section !== "all" && p.section !== state.section) return false;
    if (state.category && p.category !== state.category) return false;
    if (!q) return true;
    return [p.name, p.brand, p.article, p.category].join(" ").toLowerCase().includes(q);
  });
}

function renderChips() {
  if (state.section === "all") {
    chips.innerHTML = "";
    return;
  }
  const cats = CATEGORIES[state.section].items;
  chips.innerHTML =
    `<button class="chip ${state.category ? "" : "is-active"}" data-cat="">Все</button>` +
    cats.map(c => `<button class="chip ${state.category === c ? "is-active" : ""}" data-cat="${escapeHtml(c)}">${escapeHtml(c)}</button>`).join("");
}

function renderGrid() {
  const list = filtered();
  title.textContent = state.section === "all" ? "Каталог" : CATEGORIES[state.section].title;
  count.textContent = state.query
    ? `Найдено по запросу «${state.query}»: ${list.length}`
    : `Товаров: ${list.length}`;
  empty.hidden = list.length > 0;
  grid.innerHTML = list.map(p => `
    <article class="card" data-id="${p.id}" tabindex="0">
      <div class="card__img">${pictureFor(p)}</div>
      <div class="card__body">
        <span class="card__cat">${escapeHtml(p.category)}</span>
        <h3 class="card__name">${escapeHtml(p.name)}</h3>
        <div class="card__meta">${badges(p)}</div>
        <div class="card__price">${priceText(p)}</div>
      </div>
    </article>`).join("");
}

function render() {
  document.querySelectorAll("#sectionTabs button").forEach(b =>
    b.classList.toggle("is-active", b.dataset.section === state.section));
  renderChips();
  renderGrid();
}

function setSection(section) {
  state.section = section;
  state.category = null;
  render();
}

function openProduct(id) {
  const p = PRODUCTS.find(x => x.id === id);
  if (!p) return;
  const rows = [
    ["Раздел", CATEGORIES[p.section].title],
    ["Категория", p.category],
    ["Производитель", p.brand],
    ["Артикул", p.article],
    ["Состояние", p.condition === "used" ? "Б/у" : "Новый"],
    ["Наличие", p.inStock ? "В наличии" : "Под заказ"],
    ["Совместимость", p.compat],
  ].filter(([, v]) => v);
  modalBody.innerHTML = `
    <div class="modal__img">${pictureFor(p)}</div>
    <div class="modal__body">
      <h2>${escapeHtml(p.name)}</h2>
      <p>${escapeHtml(p.description)}</p>
      <table class="specs">${rows.map(([k, v]) => `<tr><td>${k}</td><td>${escapeHtml(v)}</td></tr>`).join("")}</table>
      <div class="modal__price">${priceText(p)}</div>
      <a class="btn btn--call btn--big" href="${PHONE_LINK}">Позвонить: ${PHONE_TEXT}</a>
    </div>`;
  modal.showModal();
}

// Плитки категорий на первом экране
document.querySelectorAll("[data-tiles]").forEach(box => {
  const section = box.dataset.tiles;
  box.innerHTML = CATEGORIES[section].items.map(c => `
    <button class="tile" data-cat="${escapeHtml(c)}">
      <span class="tile__icon">${iconFor(c)}</span>
      <span>${escapeHtml(c)}</span>
    </button>`).join("");
  box.addEventListener("click", e => {
    const tile = e.target.closest(".tile");
    if (!tile) return;
    state.section = section;
    state.category = tile.dataset.cat;
    state.query = "";
    searchInput.value = "";
    render();
    document.getElementById("catalog").scrollIntoView({ behavior: "smooth" });
  });
});

// События
document.getElementById("sectionTabs").addEventListener("click", e => {
  const b = e.target.closest("button");
  if (b) setSection(b.dataset.section);
});

chips.addEventListener("click", e => {
  const b = e.target.closest(".chip");
  if (!b) return;
  state.category = b.dataset.cat || null;
  render();
});

document.querySelectorAll("[data-section]").forEach(el => {
  if (el.closest("#sectionTabs")) return;
  el.addEventListener("click", () => {
    setSection(el.dataset.section);
    document.getElementById("catalog").scrollIntoView({ behavior: "smooth" });
  });
});

document.getElementById("searchForm").addEventListener("submit", e => {
  e.preventDefault();
  state.query = searchInput.value;
  state.section = "all";
  state.category = null;
  render();
  document.getElementById("catalog").scrollIntoView({ behavior: "smooth" });
});

searchInput.addEventListener("input", () => {
  if (searchInput.value === "" && state.query) {
    state.query = "";
    render();
  }
});

grid.addEventListener("click", e => {
  const card = e.target.closest(".card");
  if (card) openProduct(Number(card.dataset.id));
});
grid.addEventListener("keydown", e => {
  const card = e.target.closest(".card");
  if (card && e.key === "Enter") openProduct(Number(card.dataset.id));
});

document.getElementById("modalClose").addEventListener("click", () => modal.close());
modal.addEventListener("click", e => { if (e.target === modal) modal.close(); });

render();

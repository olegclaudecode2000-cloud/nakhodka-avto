// Яндекс Метрика + плашка про cookie (Олег, 15.11.2026).
// COUNTER — номер счётчика из metrika.yandex.ru. Пока 0 — ничего не загружается и плашки нет.
// Метрика включается ТОЛЬКО после «Хорошо» (согласие запоминается в браузере). Вебвизор не используем.
// Цели: «phone» — нажали на телефон, «max» — нажали на MAX.
(function () {
  const COUNTER = 0;
  const ACCENT = "#e32b2b", ACCENT_TEXT = "#fff";  // цвет кнопки под сайт
  if (!COUNTER) return;
  const PRIVACY = new URL("privacy.html", (document.currentScript || {}).src || location.href).href;  // работает и со страниц разделов
  const KEY = "cookie-ok";
  const get = () => { try { return localStorage.getItem(KEY); } catch (e) { return null; } };
  const set = v => { try { localStorage.setItem(KEY, v); } catch (e) {} };

  function load() {
    (function (m, e, t, r, i, k, a) {
      m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); };
      m[i].l = 1 * new Date();
      k = e.createElement(t); a = e.getElementsByTagName(t)[0]; k.async = 1; k.src = r; a.parentNode.insertBefore(k, a);
    })(window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
    window.ym(COUNTER, "init", { clickmap: true, trackLinks: true, accurateTrackBounce: true });
    document.addEventListener("click", e => {
      const el = e.target.closest("a, button");
      if (!el) return;
      const href = el.getAttribute("href") || "";
      if (href.startsWith("tel:")) window.ym(COUNTER, "reachGoal", "phone");
      else if (/max\.ru/.test(href) || /max/i.test(el.className)) window.ym(COUNTER, "reachGoal", "max");
    }, true);
  }

  const saved = get();
  if (saved === "1") { load(); return; }
  if (saved === "0") return;

  const css = document.createElement("style");
  css.textContent = `.cookie-bar{position:fixed;left:12px;right:12px;bottom:12px;z-index:9999;max-width:640px;margin:0 auto;
    background:#1b1f27;color:#e8eaee;border:1px solid rgba(255,255,255,.15);border-radius:14px;padding:14px 16px;
    box-shadow:0 10px 30px rgba(0,0,0,.35);font:14px/1.45 system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;
    display:flex;gap:12px;align-items:center;flex-wrap:wrap}
    .cookie-bar p{margin:0;flex:1 1 260px}.cookie-bar a{color:inherit}
    .cookie-bar button{border:0;border-radius:10px;padding:9px 16px;font:inherit;font-weight:700;cursor:pointer}
    .cookie-bar__ok{background:${ACCENT};color:${ACCENT_TEXT}}.cookie-bar__no{background:transparent;color:#b9c0ca}`;
  document.head.appendChild(css);
  const bar = document.createElement("div");
  bar.className = "cookie-bar";
  bar.setAttribute("role", "dialog");
  bar.setAttribute("aria-label", "Cookie");
  bar.innerHTML = `<p>Мы используем cookie и Яндекс Метрику, чтобы понимать, как сделать сайт удобнее.
    <a href="${PRIVACY}">Подробнее</a></p><button class="cookie-bar__ok" type="button">Хорошо</button><button class="cookie-bar__no" type="button">Нет, спасибо</button>`;
  bar.querySelector(".cookie-bar__ok").onclick = () => { set("1"); bar.remove(); load(); };
  bar.querySelector(".cookie-bar__no").onclick = () => { set("0"); bar.remove(); };
  document.body.appendChild(bar);
})();

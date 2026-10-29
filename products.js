// Каталог товаров. Пока это ПРИМЕРЫ — заменить на реальный ассортимент родителей.
// section: "parts" — автозапчасти (мама), "audio" — автозвук (папа)
// price: число в рублях или null — тогда на сайте будет «Цена по запросу»
// condition: "new" — новый, "used" — б/у
// image: путь к фото в папке images (пока фото-примеры с Unsplash)

const CATEGORIES = {
  parts: {
    title: "Автозапчасти",
    items: ["Пружины", "Амортизаторы", "Автожидкости", "Расходники"],
  },
  audio: {
    title: "Автозвук",
    items: ["Магнитолы", "Колонки", "Сабвуферы", "Усилители", "Аксессуары"],
  },
};

const PRODUCTS = [
  {
    id: 1, image: "images/product-1.jpg", section: "parts", category: "Пружины",
    name: "Пружина подвески передняя", brand: "Пример", article: "SP-0001",
    condition: "new", price: null, inStock: true,
    description: "Пример карточки товара. Здесь будет описание пружины.",
    compat: "Уточняйте по телефону",
  },
  {
    id: 2, image: "images/product-2.jpg", section: "parts", category: "Пружины",
    name: "Пружина подвески задняя", brand: "Пример", article: "SP-0002",
    condition: "new", price: null, inStock: true,
    description: "Пример карточки товара.",
    compat: "Уточняйте по телефону",
  },
  {
    id: 3, image: "images/product-3.jpg", section: "parts", category: "Амортизаторы",
    name: "Амортизатор передний газомасляный", brand: "Пример", article: "SA-0101",
    condition: "new", price: null, inStock: true,
    description: "Пример карточки товара. Здесь будет описание амортизатора.",
    compat: "Уточняйте по телефону",
  },
  {
    id: 4, image: "images/product-4.jpg", section: "parts", category: "Амортизаторы",
    name: "Амортизатор задний", brand: "Пример", article: "SA-0102",
    condition: "used", price: null, inStock: true,
    description: "Пример б/у товара.",
    compat: "Уточняйте по телефону",
  },
  {
    id: 5, image: "images/product-5.jpg", section: "parts", category: "Автожидкости",
    name: "Моторное масло 5W-30, 4 л", brand: "Пример", article: "",
    condition: "new", price: null, inStock: true,
    description: "Пример карточки товара.",
    compat: "",
  },
  {
    id: 6, image: "images/product-6.jpg", section: "parts", category: "Автожидкости",
    name: "Антифриз, 5 л", brand: "Пример", article: "",
    condition: "new", price: null, inStock: false,
    description: "Пример товара, которого сейчас нет в наличии.",
    compat: "",
  },
  {
    id: 7, image: "images/product-7.jpg", section: "parts", category: "Расходники",
    name: "Фильтр масляный", brand: "Пример", article: "OF-2201",
    condition: "new", price: null, inStock: true,
    description: "Пример карточки товара.",
    compat: "Уточняйте по телефону",
  },
  {
    id: 8, image: "images/product-8.jpg", section: "audio", category: "Магнитолы",
    name: "Автомагнитола 1DIN с Bluetooth", brand: "Пример", article: "",
    condition: "new", price: null, inStock: true,
    description: "Пример карточки товара. Здесь будут характеристики магнитолы.",
    compat: "",
  },
  {
    id: 9, image: "images/product-9.jpg", section: "audio", category: "Магнитолы",
    name: "Автомагнитола 2DIN с экраном", brand: "Пример", article: "",
    condition: "used", price: null, inStock: true,
    description: "Пример б/у товара.",
    compat: "",
  },
  {
    id: 10, image: "images/product-10.jpg", section: "audio", category: "Колонки",
    name: "Колонки коаксиальные 16 см (пара)", brand: "Пример", article: "",
    condition: "new", price: null, inStock: true,
    description: "Пример карточки товара.",
    compat: "",
  },
  {
    id: 11, image: "images/product-11.jpg", section: "audio", category: "Сабвуферы",
    name: "Сабвуфер в корпусе 12\"", brand: "Пример", article: "",
    condition: "new", price: null, inStock: true,
    description: "Пример карточки товара.",
    compat: "",
  },
  {
    id: 12, image: "images/product-12.jpg", section: "audio", category: "Усилители",
    name: "Усилитель 4-канальный", brand: "Пример", article: "",
    condition: "new", price: null, inStock: true,
    description: "Пример карточки товара.",
    compat: "",
  },
  {
    id: 13, image: "images/product-13.jpg", section: "audio", category: "Аксессуары",
    name: "Комплект проводов для усилителя", brand: "Пример", article: "",
    condition: "new", price: null, inStock: true,
    description: "Пример карточки товара.",
    compat: "",
  },
];

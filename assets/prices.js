/*
  ВСЕ ЦЕНЫ И КОЭФФИЦИЕНТЫ РЕДАКТИРУЮТСЯ ТОЛЬКО В ЭТОМ ФАЙЛЕ.
  После изменения значений страница и калькулятор обновятся автоматически.
*/
window.NEUROPIX_PRICES = {
  currency: 'RUB',
  locale: 'ru-RU',
  rounding: 50,

  services: {
    restoration: {
      name: 'Реставрация фотографий',
      shortName: 'Реставрация',
      basePrice: 900,
      unit: 'фото',
      pricePrefix: 'от',
      features: ['Удаление дефектов', 'Восстановление деталей', 'Цветокоррекция', 'Подготовка к печати']
    },
    upscale: {
      name: 'Увеличение и детализация',
      shortName: 'Увеличение',
      basePrice: 350,
      unit: 'фото',
      pricePrefix: 'от',
      features: ['Увеличение 2×–8×', 'Подавление шума', 'Контроль артефактов', 'Подготовка к печати']
    },
    retouch: {
      name: 'Портретная AI-ретушь',
      shortName: 'AI-ретушь',
      basePrice: 850,
      unit: 'фото',
      pricePrefix: 'от',
      features: ['Кожа с текстурой', 'Свет и цвет', 'Волосы и одежда', 'До двух правок']
    },
    marketplace: {
      name: 'Товары и маркетплейсы',
      shortName: 'Маркетплейсы',
      basePrice: 500,
      unit: 'фото',
      pricePrefix: 'от',
      features: ['Удаление фона', 'Чистка товара', 'Тень или отражение', 'Единый стиль серии']
    },
    colorization: {
      name: 'Колоризация и стилизация',
      shortName: 'Колоризация',
      basePrice: 700,
      unit: 'фото',
      pricePrefix: 'от',
      features: ['Колоризация', 'Тон кожи и одежды', 'Работа с окружением', 'Стилизация по референсу']
    }
  },

  complexity: [
    { id: 'basic', name: 'Базовая', multiplier: 1 },
    { id: 'medium', name: 'Средняя', multiplier: 1.5 },
    { id: 'hard', name: 'Сложная', multiplier: 2.2 }
  ],

  deadlines: [
    { id: 'standard', name: 'Стандартный срок', multiplier: 1 },
    { id: 'fast', name: 'Быстрый срок', multiplier: 1.3 },
    { id: 'urgent', name: 'Срочный срок', multiplier: 1.7 }
  ],

  quantityDiscounts: [
    { min: 50, percent: 20 },
    { min: 20, percent: 15 },
    { min: 10, percent: 10 }
  ]
};

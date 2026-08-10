/*
  ВСЕ ССЫЛКИ НА ИЗОБРАЖЕНИЯ РЕДАКТИРУЮТСЯ ТОЛЬКО В ЭТОМ ФАЙЛЕ.

  Все фото лежат непосредственно в папке /photo/.
  Формат имени: [название-услуги-на-английском]-[двухзначный-номер].jpg

  В каждой паре:
    нечётный номер = ДО
    следующий чётный номер = ПОСЛЕ

  Пример:
    photo/restoration-01.jpg — ДО
    photo/restoration-02.jpg — ПОСЛЕ
    photo/restoration-03.jpg — ДО
    photo/restoration-04.jpg — ПОСЛЕ
*/
window.NEUROPIX_IMAGES = {
  restoration: [
    { before: 'photo/restoration-07.webp', after: 'photo/restoration-08.webp', title: 'Реставрация — пример 1' },
    { before: 'photo/restoration-03.webp', after: 'photo/restoration-04.webp', title: 'Реставрация — пример 2' },
   { before: 'photo/restoration-01.webp', after: 'photo/restoration-02.webp', title: 'Реставрация — пример 3' }
  ],

  upscale: [
    { before: 'photo/upscale-01.webp', after: 'photo/upscale-02.webp', title: 'Увеличение — пример 1' },
    { before: 'photo/upscale-03.webp', after: 'photo/upscale-04.webp', title: 'Увеличение — пример 2' },
    { before: 'photo/upscale-05.webp', after: 'photo/upscale-06.webp', title: 'Увеличение — пример 3' }
  ],

  retouch: [
    { before: 'photo/retouch-01.webp', after: 'photo/retouch-02.webp', title: 'Ретушь — пример 1' },
    { before: 'photo/retouch-03.webp', after: 'photo/retouch-04.webp', title: 'Ретушь — пример 2' },
    { before: 'photo/retouch-05.webp', after: 'photo/retouch-06.webp', title: 'Ретушь — пример 3' }
  ],

  marketplace: [
    { before: 'photo/marketplace-01.webp', after: 'photo/marketplace-02.webp', title: 'Маркетплейсы — пример 1' },
    { before: 'photo/marketplace-03.webp', after: 'photo/marketplace-04.webp', title: 'Маркетплейсы — пример 2' },
    { before: 'photo/marketplace-05.webp', after: 'photo/marketplace-06.webp', title: 'Маркетплейсы — пример 3' }
  ],

  colorization: [
    { before: 'photo/colorization-01.webp', after: 'photo/colorization-02.webp', title: 'Колоризация — пример 1' },
    { before: 'photo/colorization-03.webp', after: 'photo/colorization-04.webp', title: 'Колоризация — пример 2' },
    { before: 'photo/colorization-05.webp', after: 'photo/colorization-06.webp', title: 'Колоризация — пример 3' }
  ]
};

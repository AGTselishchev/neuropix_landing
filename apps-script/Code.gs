'use strict';

const SHEET_ID = '1sIWCDWTfOPL44sxkJOkLJtIEYdi9ZpLeKsUZmeeUDPg';
const SHEET_NAME = 'Лист1';
const RATE_LIMIT_SECONDS = 10 * 60;
const RATE_LIMIT_COUNT = 5;
const GLOBAL_RATE_LIMIT_COUNT = 30;
const ALLOWED_SERVICES = new Set([
  'Реставрация фотографий',
  'Увеличение и детализация',
  'Портретная AI-ретушь',
  'Товары и маркетплейсы',
  'Колоризация и стилизация'
]);
const ALLOWED_THEMES = new Set(['night', 'urban', 'archive']);

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    const data = e && e.parameter ? e.parameter : {};
    if (cleanText(data.website, 200)) return jsonResponse({ ok: true });

    const startedAt = Number(data.startedAt);
    const elapsed = Date.now() - startedAt;
    if (!Number.isFinite(startedAt) || elapsed < 2000 || elapsed > 24 * 60 * 60 * 1000) {
      return jsonResponse({ ok: false, error: 'Некорректная сессия формы' });
    }

    const name = safeCell(data.name, 120);
    const contact = safeCell(data.contact, 200);
    const service = safeCell(data.service, 120);
    const message = safeCell(data.message, 2000);
    const themeCandidate = cleanText(data.theme, 20);
    const theme = ALLOWED_THEMES.has(themeCandidate) ? themeCandidate : 'night';
    const consent = cleanText(data.consent, 10);

    if (name.length < 2 || contact.length < 3 || !ALLOWED_SERVICES.has(service) || consent !== 'yes') {
      return jsonResponse({ ok: false, error: 'Проверьте обязательные поля' });
    }

    if (!lock.tryLock(5000)) return jsonResponse({ ok: false, error: 'Сервис временно занят' });

    const cache = CacheService.getScriptCache();
    const rateKey = 'request:' + sha256(contact.toLocaleLowerCase('ru-RU'));
    const requestCount = Number(cache.get(rateKey) || 0);
    const globalRateKey = 'request:global';
    const globalRequestCount = Number(cache.get(globalRateKey) || 0);
    const duplicateKey = 'duplicate:' + sha256([name, contact, service, message].join('\n'));
    if (requestCount >= RATE_LIMIT_COUNT) {
      return jsonResponse({ ok: false, error: 'Слишком много заявок. Попробуйте позже' });
    }
    if (globalRequestCount >= GLOBAL_RATE_LIMIT_COUNT) {
      return jsonResponse({ ok: false, error: 'Лимит заявок временно исчерпан' });
    }
    if (cache.get(duplicateKey)) return jsonResponse({ ok: true, duplicate: true });

    const book = SpreadsheetApp.openById(SHEET_ID);
    const sheet = book.getSheetByName(SHEET_NAME);
    if (!sheet) throw new Error('Target sheet was not found');

    const headers = ['Дата', 'Имя', 'Контакт', 'Услуга', 'Описание', 'Тема', 'Согласие'];
    if (sheet.getLastRow() === 0) sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.appendRow([new Date(), name, contact, service, message, theme, 'Да']);
    cache.put(rateKey, String(requestCount + 1), RATE_LIMIT_SECONDS);
    cache.put(globalRateKey, String(globalRequestCount + 1), RATE_LIMIT_SECONDS);
    cache.put(duplicateKey, '1', RATE_LIMIT_SECONDS);

    return jsonResponse({ ok: true });
  } catch (error) {
    console.error('Request processing failed:', error && error.message ? error.message : 'unknown error');
    return jsonResponse({ ok: false, error: 'Не удалось сохранить заявку' });
  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }
}

function doGet() {
  return jsonResponse({ ok: true, service: 'NEUROPIX request endpoint' });
}

function cleanText(value, maxLength) {
  return String(value || '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function safeCell(value, maxLength) {
  const cleaned = cleanText(value, maxLength);
  return /^[=+\-@]/.test(cleaned) ? "'" + cleaned : cleaned;
}

function sha256(value) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, value)
    .map(function (byte) { return ('0' + ((byte + 256) % 256).toString(16)).slice(-2); })
    .join('');
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

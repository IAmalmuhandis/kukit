// Turns pasted free-text — a note-app checklist, a WhatsApp message, a
// Google Keep list — into structured grocery items. Optimized for the
// common "one item per line" shape people actually paste; anything a line
// doesn't cleanly match just falls back to becoming the item name as-is, so
// nothing is ever silently dropped and everything stays editable afterward.

const BULLET_RE = /^(?:[-*•‣▪◦]\s*|\[\s?[xX✓]?\s?\]\s*|\d+[.)]\s*)+/;

// "2x Milk", "2 x Milk" at the start of a line.
const QTY_PREFIX_RE = /^(\d+(?:\.\d+)?)\s*[xX×]\s+/;
// "Milk x2", "Milk (2)", "Milk (x2)" at the end of a line.
const QTY_SUFFIX_RE = /\s*(?:[xX×]\s*(\d+(?:\.\d+)?)|\(\s*[xX×]?\s*(\d+(?:\.\d+)?)\s*\))\s*$/;
// Bare leading count — "2 Milk", "3 Tomato" — the recipe-list convention.
// Requires whitespace right after the digits so it never eats a size/name
// like "500ml" or "2%" where the number is glued to what follows.
const QTY_BARE_PREFIX_RE = /^(\d+(?:\.\d+)?)\s+(?=\S)/;

// ₦500, N500, NGN500, 500 naira
const CURRENCY_RE = /(?:₦|N(?:GN)?\s?)\s?(\d[\d,]*(?:\.\d+)?)|(\d[\d,]*(?:\.\d+)?)\s?(?:naira|ngn)\b/i;
// Trailing "- 500", "@ 500", ": 500", "= 500", ", 500" — a number that's
// clearly set off as a price rather than part of the item name.
const SEPARATOR_PRICE_RE = /[-@:=,]\s*(\d[\d,]*(?:\.\d+)?)\s*$/;

function toNumber(str) {
  return Number(String(str).replace(/,/g, ''));
}

/** Parses one line into { name, price, quantity }, or null for a blank line. */
export function parseGroceryLine(line) {
  let text = line.trim();
  if (!text) return null;

  text = text.replace(BULLET_RE, '').trim();
  if (!text) return null;

  let quantity = 1;

  const qtyPrefix = text.match(QTY_PREFIX_RE);
  if (qtyPrefix) {
    quantity = toNumber(qtyPrefix[1]) || 1;
    text = text.slice(qtyPrefix[0].length).trim();
  } else {
    const qtySuffix = text.match(QTY_SUFFIX_RE);
    if (qtySuffix) {
      quantity = toNumber(qtySuffix[1] ?? qtySuffix[2]) || 1;
      text = text.slice(0, qtySuffix.index).trim();
    } else {
      const qtyBare = text.match(QTY_BARE_PREFIX_RE);
      if (qtyBare) {
        quantity = toNumber(qtyBare[1]) || 1;
        text = text.slice(qtyBare[0].length).trim();
      }
    }
  }

  let price = 0;
  const currencyMatch = text.match(CURRENCY_RE);
  if (currencyMatch) {
    price = toNumber(currencyMatch[1] ?? currencyMatch[2]) || 0;
    text = (text.slice(0, currencyMatch.index) + text.slice(currencyMatch.index + currencyMatch[0].length)).trim();
  } else {
    const sepMatch = text.match(SEPARATOR_PRICE_RE);
    if (sepMatch) {
      price = toNumber(sepMatch[1]) || 0;
      text = text.slice(0, sepMatch.index).trim();
    }
  }

  // Strip leftover separator punctuation the price/qty extraction exposed
  // at the edges, e.g. "Milk -" -> "Milk", or "- Milk" (rare, defensive).
  text = text.replace(/^[-@:=,]+\s*/, '').replace(/[-@:=,]+\s*$/, '').trim();

  if (!text) return null;
  return { name: text, price, quantity };
}

/**
 * Parses a full pasted block of text into items, one per non-empty line.
 * Returns [] if there's nothing usable (e.g. it was all blank lines).
 */
export function parseGroceryList(text) {
  return String(text)
    .split(/\r?\n/)
    .map(parseGroceryLine)
    .filter(Boolean);
}

/** True when text looks like a multi-item paste worth auto-parsing (2+ non-blank lines). */
export function looksLikeList(text) {
  const lines = String(text)
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  return lines.length > 1;
}

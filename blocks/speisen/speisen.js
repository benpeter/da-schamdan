/**
 * Decorates the speisen (menu) block.
 *
 * Transforms a 2-column authored structure (item info | prices)
 * into a 5-cell visual layout matching the original grid:
 *   .item-nr | .item-info | .item-desc | .item-sizes | .item-prices
 *
 * Content model (Collection):
 *   Col 1: **Nr** Item Name *optional description*
 *   Col 2: Price — or multi-line for size variants (e.g. "0,3l 3,30 €")
 *
 * Multi-price handling:
 *   - "label price" patterns (e.g. "0,3l 3,30 €") split into sizes + prices columns
 *   - Bare multi-prices (e.g. pizza "7,00 €" / "8,00 €") distribute across columns
 *   - Header rows (empty info + bold labels) become column headers
 */

const PRICE_RE = /^(.+?)\s+(\d[\d,.]*\s*€)$/;

function headerCellHTML(p) {
  const strong = p.querySelector('strong');
  if (!strong) return p.outerHTML;
  const boldText = strong.textContent;
  const rest = p.textContent.replace(boldText, '').trim();
  let html = `<p><strong>${boldText}</strong></p>`;
  if (rest) html += `<p>${rest}</p>`;
  return html;
}

function decorateHeaderRow(row, priceCol) {
  const pElements = [...priceCol.querySelectorAll('p')];

  const nrEl = document.createElement('div');
  nrEl.className = 'item-nr';

  const infoEl = document.createElement('div');
  infoEl.className = 'item-info';

  const descEl = document.createElement('div');
  descEl.className = 'item-desc';

  const sizesEl = document.createElement('div');
  sizesEl.className = 'item-sizes';

  const pricesEl = document.createElement('div');
  pricesEl.className = 'item-prices';

  if (pElements.length >= 2) {
    sizesEl.innerHTML = headerCellHTML(pElements[0]);
    pricesEl.innerHTML = headerCellHTML(pElements[1]);
  } else if (pElements.length === 1) {
    pricesEl.innerHTML = headerCellHTML(pElements[0]);
  }

  row.classList.add('price-header');
  row.replaceChildren(nrEl, infoEl, descEl, sizesEl, pricesEl);
}

function splitPrices(priceCol) {
  const sizesEl = document.createElement('div');
  sizesEl.className = 'item-sizes';

  const pricesEl = document.createElement('div');
  pricesEl.className = 'item-prices';

  const pElements = [...priceCol.querySelectorAll('p')];

  if (pElements.length === 0) {
    // Raw text — move everything to prices
    while (priceCol.firstChild) {
      pricesEl.appendChild(priceCol.firstChild);
    }
    return { sizesEl, pricesEl };
  }

  const matches = pElements.map((p) => p.textContent.trim().match(PRICE_RE));

  if (matches.every((m) => m !== null)) {
    // All paragraphs have "label price" pattern → split
    sizesEl.innerHTML = matches.map((m) => `<p>${m[1]}</p>`).join('');
    pricesEl.innerHTML = matches.map((m) => `<p>${m[2]}</p>`).join('');
  } else if (pElements.length > 1) {
    // Multiple bare prices → first to sizes col, remaining to prices col
    sizesEl.appendChild(pElements[0]);
    for (let i = 1; i < pElements.length; i += 1) {
      pricesEl.appendChild(pElements[i]);
    }
  } else {
    // Single bare price → prices column only
    pricesEl.appendChild(pElements[0]);
  }

  return { sizesEl, pricesEl };
}

export default function decorate(block) {
  [...block.children].forEach((row) => {
    const cols = [...row.children];
    if (cols.length < 2) return;

    const [info, priceCol] = cols;

    // Detect header row: empty info column with bold text in price column
    if (!info.textContent.trim() && priceCol.querySelector('strong')) {
      decorateHeaderRow(row, priceCol);
      return;
    }

    // Extract item number from a leading <strong> that matches Nr pattern
    const firstP = info.querySelector('p');
    const container = firstP || info;
    const firstEl = container.firstElementChild;
    let nr = '';

    if (firstEl?.tagName === 'STRONG') {
      const text = firstEl.textContent.trim();
      if (/^[A-Za-z]?\d+[a-z]?$/.test(text)) {
        nr = text;
        firstEl.remove();
        const next = container.firstChild;
        if (next?.nodeType === Node.TEXT_NODE) {
          next.textContent = next.textContent.replace(/^\s+/, '');
        }
      }
    }

    // Extract <em> description into a separate grid item
    let descText = '';
    const em = container.querySelector('em');
    if (em) {
      descText = em.textContent;
      em.remove();
      container.normalize();
      if (container.lastChild?.nodeType === Node.TEXT_NODE) {
        container.lastChild.textContent = container.lastChild.textContent.trimEnd();
      }
    }

    // Split prices into sizes + prices columns
    const { sizesEl, pricesEl } = splitPrices(priceCol);

    // Build the 5-cell row: nr | info | desc | sizes | prices
    const nrEl = document.createElement('div');
    nrEl.className = 'item-nr';
    nrEl.textContent = nr;

    const descEl = document.createElement('div');
    descEl.className = 'item-desc';
    descEl.textContent = descText;

    info.className = 'item-info';
    row.replaceChildren(nrEl, info, descEl, sizesEl, pricesEl);
  });
}

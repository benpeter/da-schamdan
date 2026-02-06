/**
 * Decorates the speisen (menu) block.
 *
 * Transforms a 2-column authored structure (item info | prices)
 * into a 4-cell visual layout matching the original grid:
 *   .item-nr | .item-info | .item-desc | .item-prices
 *
 * Content model (Collection):
 *   Col 1: **Nr** Item Name *optional description*
 *   Col 2: Price — or multi-line for size variants
 */
export default function decorate(block) {
  [...block.children].forEach((row) => {
    const cols = [...row.children];
    if (cols.length < 2) return;

    const [info, prices] = cols;

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

    // Extract <em> description into a separate grid item (sibling, not child)
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

    // Build the 4-cell row: nr | info | desc | prices
    const nrEl = document.createElement('div');
    nrEl.className = 'item-nr';
    nrEl.textContent = nr;

    const descEl = document.createElement('div');
    descEl.className = 'item-desc';
    descEl.textContent = descText;

    info.className = 'item-info';
    prices.className = 'item-prices';

    row.prepend(nrEl);
    // Insert desc after info, before prices
    prices.before(descEl);
  });
}

/**
 * Decorates the speisen (menu) block.
 *
 * Transforms a 2-column authored structure (item info | prices)
 * into a 3-column visual layout (nr | name+desc | prices).
 *
 * Content model (Collection):
 *   Col 1: **Nr** Item Name *optional description*
 *   Col 2: Price — or multi-line for size variants (e.g. "klein 3,30 €\ngroß 4,40 €")
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
        // Remove leading whitespace left after the number
        const next = container.firstChild;
        if (next?.nodeType === Node.TEXT_NODE) {
          next.textContent = next.textContent.replace(/^\s+/, '');
        }
      }
    }

    // Move <em> description into its own paragraph below the name
    const em = container.querySelector('em');
    if (em) {
      const descP = document.createElement('p');
      descP.className = 'item-desc';
      descP.textContent = em.textContent;
      container.after(descP);
      em.remove();
      // Trim trailing whitespace from the name paragraph
      container.normalize();
      if (container.lastChild?.nodeType === Node.TEXT_NODE) {
        container.lastChild.textContent = container.lastChild.textContent.trimEnd();
      }
    }

    // Create number cell and prepend it to the row
    const nrEl = document.createElement('div');
    nrEl.className = 'item-nr';
    nrEl.textContent = nr;

    info.className = 'item-info';
    prices.className = 'item-prices';

    row.prepend(nrEl);
  });
}

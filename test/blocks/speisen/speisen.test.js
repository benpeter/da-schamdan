/* eslint-disable no-unused-expressions */
/* global describe it */

import { expect } from '@esm-bundle/chai';
import decorate from '../../../blocks/speisen/speisen.js';

await new Promise((resolve) => {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '/blocks/speisen/speisen.css';
  link.onload = resolve;
  document.head.append(link);
});

describe('Speisen block', () => {
  it('does not overflow a phone screen when a name has a very long word', () => {
    const phone = document.createElement('div');
    phone.lang = 'de';
    phone.style.width = '361px';
    phone.style.fontSize = '22px';
    phone.innerHTML = `
      <div class="speisen block">
        <div>
          <div><strong>65</strong> Gemischter Salat mit Donaudampfschifffahrtsgesellschaftskapitänsmütze</div>
          <div><p>groß 13,90 €</p><p>klein 10,90 €</p></div>
        </div>
      </div>`;
    document.body.append(phone);
    decorate(phone.querySelector('.speisen'));
    expect(phone.scrollWidth).to.be.at.most(phone.clientWidth);
    phone.remove();
  });
});

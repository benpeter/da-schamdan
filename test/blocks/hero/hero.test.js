/* eslint-disable no-unused-expressions */
/* global describe it */

import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import {
  buildBlock,
  decorateSections,
  decorateBlocks,
} from '../../../scripts/aem.js';

document.body.innerHTML = await readFile({ path: '../../scripts/body.html' });

describe('Hero block', () => {
  it('Builds hero block from picture and h1', async () => {
    const main = document.querySelector('main');
    const h1 = main.querySelector('h1');
    const picture = main.querySelector('picture');
    // eslint-disable-next-line no-bitwise
    if (h1 && picture && (h1.compareDocumentPosition(picture) & Node.DOCUMENT_POSITION_PRECEDING)) {
      const section = document.createElement('div');
      section.append(buildBlock('hero', { elems: [picture, h1] }));
      main.prepend(section);
    }
    decorateSections(main);
    decorateBlocks(main);
    expect(document.querySelector('.hero')).to.exist;
    expect(document.querySelector('.hero.block')).to.exist;
  });
});

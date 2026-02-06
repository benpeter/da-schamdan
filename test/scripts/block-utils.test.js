/* eslint-disable no-unused-expressions */
/* global describe before it */

import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

let blockUtils;

document.body.innerHTML = await readFile({ path: './dummy.html' });
document.head.innerHTML = await readFile({ path: './head.html' });

describe('Utils methods', () => {
  before(async () => {
    blockUtils = await import('../../scripts/aem.js');
    document.body.innerHTML = await readFile({ path: './body.html' });
  });

  it('Sanitizes class name', async () => {
    expect(blockUtils.toClassName('Hello world')).to.equal('hello-world');
    expect(blockUtils.toClassName(null)).to.equal('');
  });

  it('Extracts metadata', async () => {
    expect(blockUtils.getMetadata('description')).to.equal('Lorem ipsum dolor sit amet.');
    expect(blockUtils.getMetadata('og:title')).to.equal('Foo');
  });

  it('Loads CSS', async () => {
    // loads a css file
    await blockUtils.loadCSS('/test/scripts/test.css');
    expect(getComputedStyle(document.body).color).to.equal('rgb(255, 0, 0)');

    // does nothing if css already loaded (resolves immediately)
    await blockUtils.loadCSS('/test/scripts/test.css');
  });

  it('Creates optimized picture', async () => {
    const $picture = blockUtils.createOptimizedPicture('/test/scripts/mock.png');
    expect($picture.querySelector(':scope source[type="image/webp"]')).to.exist; // webp
    expect($picture.querySelector(':scope source:not([type="image/webp"])')).to.exist; // fallback
    expect($picture.querySelector(':scope img').src).to.include('format=png&optimize=medium'); // default
  });
});

describe('Sections and blocks', () => {
  it('Decorates sections', async () => {
    blockUtils.decorateSections(document.querySelector('main'));
    expect(document.querySelectorAll('main .section').length).to.equal(2);
  });

  it('Decorates blocks', async () => {
    blockUtils.decorateBlocks(document.querySelector('main'));
    expect(document.querySelectorAll('main .block').length).to.equal(1);
  });

  it('Loads sections', async () => {
    await blockUtils.loadSections(document.querySelector('main'));
    document.querySelectorAll('main .section').forEach(($section) => {
      expect($section.dataset.sectionStatus).to.equal('loaded');
    });
  });

  it('Reads block config', async () => {
    document.querySelector('main .section > div').innerHTML += await readFile({ path: './config.html' });
    const cfg = blockUtils.readBlockConfig(document.querySelector('main .config'));
    expect(cfg).to.deep.include({
      'prop-0': 'Plain text',
      'prop-1': 'Paragraph',
      'prop-2': ['First paragraph', 'Second paragraph'],
      'prop-3': 'https://www.adobe.com/',
      'prop-4': ['https://www.adobe.com/', 'https://www.hlx.live/'],
    });
  });
});

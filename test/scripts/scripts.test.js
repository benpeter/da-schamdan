/* eslint-disable no-unused-expressions */
/* global describe before it */

import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
// eslint-disable-next-line no-unused-vars
import * as aem from '../../scripts/aem.js';

document.body.innerHTML = await readFile({ path: './dummy.html' });
document.head.innerHTML = await readFile({ path: './head.html' });

describe('Core Helix features', () => {
  before(async () => {
    document.body.innerHTML = await readFile({ path: './body.html' });
  });

  it('Initializes window.hlx', async () => {
    expect(window.hlx).to.exist;
    expect(window.hlx.codeBasePath).to.exist;
  });
});

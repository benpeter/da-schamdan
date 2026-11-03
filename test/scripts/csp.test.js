/* eslint-disable no-unused-expressions */
/* global describe it */

import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

const head = new DOMParser().parseFromString(await readFile({ path: '../../head.html' }), 'text/html');
const csp = head.querySelector('meta[http-equiv="Content-Security-Policy"]');

describe('Content-Security-Policy in head.html', () => {
  it('is present', () => {
    expect(csp).to.exist;
  });

  it('does not require trusted types, the blocks assign innerHTML', () => {
    expect(csp.getAttribute('content')).to.not.contain('require-trusted-types-for');
  });

  it('still restricts scripts to the nonce', () => {
    expect(csp.getAttribute('content')).to.contain("script-src 'nonce-aem'");
  });
});

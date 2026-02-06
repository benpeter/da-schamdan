// eslint-disable-next-line import/no-cycle
import { sampleRUM } from './aem.js';

// Core Web Vitals RUM collection
sampleRUM('cwv');

// add more delayed functionality here

function isLocal(a) {
  return window.location.hostname === a.hostname || !a.hostname.length;
}

// open external links in a new window
document.querySelectorAll('a').forEach((a) => {
  if (!isLocal(a)) {
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
  }
});

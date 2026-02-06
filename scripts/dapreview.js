const defined = new URLSearchParams(window.location.search).get('dapreview');
// eslint-disable-next-line import/no-unresolved
export default defined ? import('https://da.live/scripts/dapreview.js') : undefined;

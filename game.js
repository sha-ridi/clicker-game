;(function (global) {
  const BALANCE = (typeof module !== 'undefined' && module.exports)
    ? require('./balance.js')
    : global.BALANCE;

  const api = {};

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else global.GAME = api;
})(typeof window !== 'undefined' ? window : globalThis);

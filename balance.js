;(function (global) {
  const BALANCE = {};
  if (typeof module !== 'undefined' && module.exports) module.exports = BALANCE;
  else global.BALANCE = BALANCE;
})(typeof window !== 'undefined' ? window : globalThis);

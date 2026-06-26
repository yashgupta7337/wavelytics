// fetch() with an abort-based timeout. Used by the data hooks so a sleeping
// (cold-starting) API doesn't leave a request hanging for ~50-60s — we give up
// quickly and fall back to the local demo feed instead. The warm API answers in
// well under the timeout, so this is invisible in normal use.
export function fetchTimeout(url, options = {}, ms = 3500) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, { ...options, signal: ctrl.signal }).finally(() =>
    clearTimeout(id)
  );
}

export function observeAd(card, options = {}) {
  const doc = options.document ?? document;
  const Observer = options.Observer ?? IntersectionObserver;
  const send = options.send ?? ((payload) => fetch('/ad-impression.php', {
    method:'POST', credentials:'omit', cache:'no-store', keepalive:true,
    headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload),
  }).then(r => { if (!r.ok) throw Error('Not recorded'); }));
  const uuid = options.uuid ?? (() => crypto.randomUUID());
  const later = options.later ?? ((fn,ms) => setTimeout(fn,ms));
  let visible = false, captured = false, sent = false, attempts = 0, id;
  const erid = card.dataset.adErid;
  function retry() {
    if (sent || attempts >= 3) return;
    attempts++;
    Promise.resolve().then(()=>send({event_id:id,erid})).then(()=>{sent=true;},()=>{
      if (attempts < 3) later(retry, attempts * 2000);
      else options.onFailure?.();
    });
  }
  function check() {
    if (captured || !visible || doc.visibilityState !== 'visible') return;
    captured = true; id = uuid(); observer.disconnect();
    doc.removeEventListener('visibilitychange',check);
    retry();
  }
  const observer = new Observer(entries=>{
    visible = entries.some(e=>e.target===card && e.isIntersecting && e.intersectionRatio > 0);
    check();
  }, {threshold:0});
  doc.addEventListener('visibilitychange',check);
  observer.observe(card);
  return () => { observer.disconnect(); doc.removeEventListener('visibilitychange',check); };
}
// Enable only on the registered Russian creative. No call occurs without the marker.
if (typeof document !== 'undefined') {
  document.querySelectorAll('[data-ad-erid="MvGzQC9JbZnS6fV7CXrHCtaz"]').forEach(card=>observeAd(card));
}

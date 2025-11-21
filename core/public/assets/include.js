// Simple client-side include loader
(function(){
  async function loadInclude(el){
    const url = el.getAttribute('data-include');
    if(!url) return;
    try{
      const res = await fetch(url);
      if(!res.ok) throw new Error('Include not found: '+url);
      const text = await res.text();
      const frag = document.createElement('div');
      frag.innerHTML = text;
      // Replace placeholder with content (preserve scripts in content)
      const parent = el.parentNode;
      while(frag.firstChild){
        parent.insertBefore(frag.firstChild, el);
      }
      parent.removeChild(el);
    }catch(err){
      console.error(err);
    }
  }

  function init(){
    const includes = Array.from(document.querySelectorAll('[data-include]'));
    // Load all includes sequentially to preserve order
    (async function(){
      for(const el of includes){
        await loadInclude(el);
      }
      // Dispatch an event when includes are ready
      document.dispatchEvent(new Event('includes:loaded'));
    })();
  }

  // Start loading includes immediately so includes are available before DOMContentLoaded handlers run
  init();
})();

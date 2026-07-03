(() => {
  function ensureOverlay(){
    let el = document.getElementById('pageTransition');
    if(!el){
      el = document.createElement('div');
      el.id = 'pageTransition';
      el.innerHTML = `
        <div class="pt-logo">
          <div class="line1">LOADING</div>
          <div class="line2">QUIZ ARENA</div>
        </div>
        <div class="pt-bar"><span></span></div>
      `;
      document.body.appendChild(el);
    }
    return el;
  }

  const overlay = ensureOverlay();

  function showOverlay(){
    overlay.classList.add('show');
  }
  function hideOverlay(){
    overlay.classList.remove('show');
  }

  // Show a quick intro on first load (optional)
  window.addEventListener('load', () => {
    // quick fade-in effect
    showOverlay();
    setTimeout(hideOverlay, 280);
  });

  // Intercept internal nav
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-nav]');
    if(!a) return;
    const href = a.getAttribute('href');
    if(!href || href.startsWith('http') || href.startsWith('#')) return;
    e.preventDefault();
    showOverlay();
    // small delay to let animation appear
    setTimeout(() => { window.location.href = href; }, 220);
  });
})();
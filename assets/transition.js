/* Page transition controller — pairs with assets/transition.css */
(function () {
  const overlay = document.querySelector('.page-transition');
  if (!overlay) return;

  // Respect reduced-motion users — skip the choreography entirely.
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;

  // Bail on browser back/forward — pageshow fires when navigating via history,
  // so we re-trigger the reveal so the slab plays correctly when you go back.
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) {
      overlay.classList.remove('outro');
      overlay.classList.remove('intro');
      // Force reflow so the animation restarts
      void overlay.offsetWidth;
      overlay.classList.add('intro');
    }
  });

  const SAME_ORIGIN = location.origin;
  const COVER_DURATION = 650; // must match .outro animation duration

  function isInternalNavLink(link) {
    if (!link) return false;
    if (link.target && link.target !== '' && link.target !== '_self') return false;
    if (link.hasAttribute('download')) return false;
    const href = link.getAttribute('href');
    if (!href) return false;
    if (href.startsWith('#')) return false;
    if (href.startsWith('mailto:') || href.startsWith('tel:')) return false;
    if (href.startsWith('javascript:')) return false;
    let url;
    try { url = new URL(link.href, location.href); } catch (e) { return false; }
    if (url.origin !== SAME_ORIGIN) return false;
    // Same page + only hash change — let the browser handle it
    if (url.pathname === location.pathname && url.hash) return false;
    return true;
  }

  // Returns true when the destination page wants the cream/light slab.
  // Currently only contact.html — extend here if more pages adopt it.
  function destinationIsLightSlab(href) {
    try {
      const url = new URL(href, location.href);
      const last = url.pathname.split('/').pop() || '';
      return last === 'contact.html';
    } catch (e) {
      return false;
    }
  }

  document.addEventListener('click', (e) => {
    // Modifier keys → allow new-tab/window default behavior
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;

    const link = e.target.closest('a');
    if (!isInternalNavLink(link)) return;

    e.preventDefault();
    overlay.classList.remove('intro');

    // Pre-match the destination's slab color so the wipe stays one continuous color.
    // Use the cream/light slab when EITHER the source or the destination is contact —
    // contact's orange bg needs cream contrast, and the destination needs to know
    // (via sessionStorage) so its reveal slab matches.
    const onContact = (location.pathname.split('/').pop() || '') === 'contact.html';
    const useLight = onContact || destinationIsLightSlab(link.href);

    if (useLight) {
      overlay.classList.add('theme-light');
      document.documentElement.classList.add('pt-light');
      try { sessionStorage.setItem('pt-light', '1'); } catch (err) {}
    } else {
      overlay.classList.remove('theme-light');
      document.documentElement.classList.remove('pt-light');
      try { sessionStorage.removeItem('pt-light'); } catch (err) {}
    }

    // Force reflow before adding outro so the keyframe restarts
    void overlay.offsetWidth;
    overlay.classList.add('outro');

    setTimeout(() => {
      window.location.href = link.href;
    }, COVER_DURATION - 30); // navigate just before slab fully covers
  });
})();

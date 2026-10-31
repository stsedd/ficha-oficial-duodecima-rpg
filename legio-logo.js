/* Duodécima · símbolo oficial no cabeçalho · v5.25.1 */
(() => {
  'use strict';
  const styles = document.createElement('style');
  styles.textContent = `
    .archive-brand-copy { display:flex!important;align-items:center!important;gap:8px!important;min-width:0 }
    .archive-brand-copy .archive-brand-kicker { display:none!important }
    .archive-brand-copy .legio-logo { width:43px;height:43px;object-fit:contain;flex:none;display:block }
    @media(max-width:600px){.archive-brand-copy .legio-logo{width:36px;height:36px}}
  `;
  document.head.appendChild(styles);

  function updateLogo() {
    const container = document.querySelector('.archive-brand-copy');
    if (!container) return;
    let logo = container.querySelector('img.legio-logo');
    if (!logo) {
      logo = document.createElement('img');
      logo.className = 'legio-logo';
      logo.alt = 'Símbolo da Legio XII Fulminata';
      logo.decoding = 'async';
      container.prepend(logo);
    }
    const body = document.body;
    const mode = String(body.dataset.mode || body.getAttribute('data-theme-mode') || 'dark').toLowerCase();
    const palette = String(body.dataset.palette || '').toLowerCase();
    const special = String(body.dataset.special || '').toLowerCase();
    const originalRed = palette === 'red' && (special === 'none' || special === '');
    const src = originalRed ? 'legio-vermelho.png?v=5.25.1'
      : mode === 'light' ? 'legio-preto.png?v=5.25.1'
      : 'legio-branco.png?v=5.25.1';
    if (logo.getAttribute('src') !== src) logo.setAttribute('src', src);
  }

  function start() {
    updateLogo();
    const observer = new MutationObserver(updateLogo);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['data-mode', 'data-theme-mode', 'data-palette', 'data-special']
    });
    const brand = document.querySelector('.archive-brand-copy');
    if (brand) observer.observe(brand, { childList: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();

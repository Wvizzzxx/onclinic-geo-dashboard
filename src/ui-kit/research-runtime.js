(() => {
  const MOBILE_QUERY = '(max-width: 767px)';
  const handoff = document.getElementById('mobileResearchHandoff');
  const closeBtn = document.getElementById('mobileResearchHandoffClose');
  const copyBtn = document.getElementById('copyResearchLink');
  const status = document.getElementById('mobileResearchHandoffStatus');
  const shouldAutoShow = document.body?.dataset.mobileHandoff === 'true';
  const storageKey = `aisov-mobile-handoff-dismissed:${location.pathname}`;
  const canonicalUrl = document.querySelector('link[rel="canonical"]')?.href;
  const copyUrl = canonicalUrl && /^https?:\/\//.test(canonicalUrl) ? canonicalUrl : location.href;

  // Give responsive card/table layouts their labels from the desktop headers.
  document.querySelectorAll('table').forEach((table) => {
    const labels = [...table.querySelectorAll('thead th')].map((th) =>
      th.textContent.replace(/\?/g, '').replace(/\s+/g, ' ').trim()
    );
    table.querySelectorAll('tbody tr').forEach((row) => {
      [...row.querySelectorAll('td')].forEach((cell, index) => {
        // tbody cells begin after the row-header column.
        const label = labels[index + 1] || labels[index] || '';
        if (label && !cell.dataset.label) cell.dataset.label = label;
      });
    });
  });

  if (!handoff || !shouldAutoShow) return;

  const mq = window.matchMedia(MOBILE_QUERY);

  const setStatus = (message) => {
    if (status) status.textContent = message;
  };

  const copyLink = async () => {
    let copied = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(copyUrl);
        copied = true;
      }
    } catch (_) {}

    if (!copied) {
      const input = document.createElement('textarea');
      input.value = copyUrl;
      input.setAttribute('readonly', '');
      input.style.position = 'fixed';
      input.style.opacity = '0';
      document.body.appendChild(input);
      input.focus({ preventScroll: true });
      input.select();
      input.setSelectionRange(0, input.value.length);
      try { copied = document.execCommand('copy'); } catch (_) {}
      input.remove();
    }

    if (copied) {
      setStatus('Ссылка на исследование скопирована.');
      if (copyBtn) {
        const old = copyBtn.textContent;
        copyBtn.textContent = 'Скопировано';
        setTimeout(() => { copyBtn.textContent = old; }, 1400);
      }
    } else {
      setStatus('Не удалось скопировать ссылку. Скопируйте адрес из строки браузера.');
    }
    return copied;
  };

  const show = () => {
    if (!mq.matches) {
      handoff.hidden = true;
      document.body.classList.remove('mobile-handoff-visible');
      return;
    }
    try {
      if (sessionStorage.getItem(storageKey) === '1') return;
    } catch (_) {}
    handoff.hidden = false;
    document.body.classList.add('mobile-handoff-visible');
  };

  const hide = () => {
    handoff.hidden = true;
    document.body.classList.remove('mobile-handoff-visible');
    try { sessionStorage.setItem(storageKey, '1'); } catch (_) {}
  };

  closeBtn?.addEventListener('click', hide);

  copyBtn?.addEventListener('click', copyLink);

  const onViewportChange = () => {
    if (mq.matches) show();
    else {
      handoff.hidden = true;
      document.body.classList.remove('mobile-handoff-visible');
    }
  };

  mq.addEventListener?.('change', onViewportChange);
  onViewportChange();
})();

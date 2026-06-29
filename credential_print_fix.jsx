/* credential_print_fix.jsx — Corrección de impresión para credenciales de usuarios */
(function () {
  function injectCredentialPrintStyles() {
    if (document.getElementById('piaget-credential-print-fix')) return;
    const style = document.createElement('style');
    style.id = 'piaget-credential-print-fix';
    style.textContent = `
      @media print {
        @page {
          size: auto;
          margin: 12mm;
        }

        html,
        body {
          overflow: visible !important;
          background: #fff !important;
          height: auto !important;
        }

        body * {
          visibility: hidden !important;
        }

        .cred-print,
        .cred-print * {
          visibility: visible !important;
        }

        .cred-print {
          position: fixed !important;
          left: 50% !important;
          top: 20px !important;
          transform: translateX(-50%) !important;
          width: 330px !important;
          max-width: 330px !important;
          box-shadow: none !important;
          background: #fff !important;
          color: #111827 !important;
          break-inside: avoid !important;
          page-break-inside: avoid !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        .cred-print .badge {
          white-space: normal !important;
          max-width: 220px !important;
          text-align: center !important;
          overflow-wrap: anywhere !important;
          word-break: break-word !important;
        }

        .cred-print svg {
          max-width: 100% !important;
          height: auto !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function markCredentialCards() {
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
      const eyebrow = card.querySelector('.eyebrow');
      const isCredential = eyebrow && String(eyebrow.textContent || '').trim() === 'Credencial de acceso' && card.textContent.includes('PIAGET');
      if (isCredential) card.classList.add('cred-print');
    });
  }

  function boot() {
    injectCredentialPrintStyles();
    markCredentialCards();

    const observer = new MutationObserver(markCredentialCards);
    observer.observe(document.body, { childList: true, subtree: true });

    window.addEventListener('beforeprint', markCredentialCards);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();

// ─── HealthLocker PWA: Service Worker Registration & Install Prompt ─────────

// ─── SERVICE WORKER REGISTRATION ────────────────────────────────────────────────
export function registerServiceWorker(): void {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('/service-worker.js', {
          scope: '/',
        });

        console.log(
          '✅ [HealthLocker] Service Worker registered successfully with scope:',
          registration.scope
        );

        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'activated') {
                console.log('🔄 [HealthLocker] New service worker activated — content updated.');
              }
            });
          }
        });
      } catch (error) {
        console.error('❌ [HealthLocker] Service Worker registration failed:', error);
      }
    });
  } else {
    console.warn('⚠️ [HealthLocker] Service Workers are not supported in this browser.');
  }
}

// ─── INSTALL PROMPT MANAGEMENT ──────────────────────────────────────────────────

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;

/**
 * Initialize the PWA install prompt handling.
 * Captures the `beforeinstallprompt` event and manages the install button visibility.
 */
export function initInstallPrompt(): void {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;

    console.log('📲 [HealthLocker] Install prompt captured — app is installable!');

    // Show the install button
    showInstallButton();
  });

  // Listen for successful install
  window.addEventListener('appinstalled', () => {
    console.log('🎉 [HealthLocker] App installed successfully!');
    deferredPrompt = null;
    hideInstallButton();
  });
}

/**
 * Trigger the native PWA install prompt.
 * Call this from the install button's click handler.
 */
export async function triggerInstallPrompt(): Promise<boolean> {
  if (!deferredPrompt) {
    console.warn('⚠️ [HealthLocker] No install prompt available.');
    return false;
  }

  try {
    await deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;

    if (choiceResult.outcome === 'accepted') {
      console.log('✅ [HealthLocker] User accepted the install prompt.');
      deferredPrompt = null;
      return true;
    } else {
      console.log('ℹ️ [HealthLocker] User dismissed the install prompt.');
      return false;
    }
  } catch (error) {
    console.error('❌ [HealthLocker] Install prompt error:', error);
    return false;
  }
}

/**
 * Check if the install prompt is available.
 */
export function isInstallAvailable(): boolean {
  return deferredPrompt !== null;
}

// ─── INSTALL BUTTON UI ─────────────────────────────────────────────────────────

function showInstallButton(): void {
  // Remove existing button if present
  const existing = document.getElementById('pwa-install-btn');
  if (existing) {
    existing.style.display = 'flex';
    return;
  }

  const btn = document.createElement('button');
  btn.id = 'pwa-install-btn';
  btn.setAttribute('aria-label', 'Install HealthLocker App');
  btn.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
    <span>Install App</span>
  `;

  // Styles
  Object.assign(btn.style, {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    zIndex: '10000',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 20px',
    background: 'linear-gradient(135deg, #1B6F63 0%, #2dd4bf 100%)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '12px',
    fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 8px 32px rgba(27, 111, 99, 0.35), 0 2px 8px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    backdropFilter: 'blur(8px)',
    animation: 'pwa-slide-in 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
  });

  // Hover effect
  btn.addEventListener('mouseenter', () => {
    btn.style.transform = 'translateY(-3px) scale(1.02)';
    btn.style.boxShadow = '0 12px 40px rgba(27, 111, 99, 0.45), 0 4px 12px rgba(0, 0, 0, 0.15)';
  });

  btn.addEventListener('mouseleave', () => {
    btn.style.transform = 'translateY(0) scale(1)';
    btn.style.boxShadow = '0 8px 32px rgba(27, 111, 99, 0.35), 0 2px 8px rgba(0, 0, 0, 0.1)';
  });

  // Click handler
  btn.addEventListener('click', async () => {
    const installed = await triggerInstallPrompt();
    if (installed) {
      hideInstallButton();
    }
  });

  // Inject animation keyframes
  if (!document.getElementById('pwa-install-styles')) {
    const style = document.createElement('style');
    style.id = 'pwa-install-styles';
    style.textContent = `
      @keyframes pwa-slide-in {
        from {
          opacity: 0;
          transform: translateY(20px) scale(0.95);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
      @media (max-width: 480px) {
        #pwa-install-btn {
          bottom: 16px !important;
          right: 16px !important;
          left: 16px !important;
          justify-content: center !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(btn);
}

function hideInstallButton(): void {
  const btn = document.getElementById('pwa-install-btn');
  if (btn) {
    btn.style.animation = 'pwa-slide-in 0.3s cubic-bezier(0.4, 0, 0.2, 1) reverse';
    setTimeout(() => btn.remove(), 300);
  }
}

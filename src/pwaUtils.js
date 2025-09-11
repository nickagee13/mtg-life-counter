// PWA utilities for MTG Life Counter

// Service Worker registration
export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered successfully:', registration);
      
      // Handle service worker updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New content is available, show a message to refresh
            if (window.confirm('New version available! Reload to update?')) {
              window.location.reload();
            }
          }
        });
      });
      
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }
};

// PWA installation prompt handling
export const setupPWAInstallPrompt = () => {
  let deferredPrompt = null;
  
  // Store the beforeinstallprompt event
  window.addEventListener('beforeinstallprompt', (event) => {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    event.preventDefault();
    deferredPrompt = event;
    
    // Show custom install button or prompt
    showInstallPrompt(deferredPrompt);
  });
  
  // Handle the appinstalled event
  window.addEventListener('appinstalled', () => {
    console.log('PWA was installed');
    deferredPrompt = null;
    hideInstallPrompt();
  });
  
  return deferredPrompt;
};

// Show install prompt
const showInstallPrompt = (deferredPrompt) => {
  // Create install banner if it doesn't exist
  let installBanner = document.getElementById('pwa-install-banner');
  if (!installBanner) {
    installBanner = document.createElement('div');
    installBanner.id = 'pwa-install-banner';
    installBanner.innerHTML = `
      <div style="
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #1a1a1a;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        gap: 12px;
        z-index: 1000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        max-width: 90vw;
        animation: slideUp 0.3s ease-out;
      ">
        <span>Install MTG Life Counter for easy access!</span>
        <button id="pwa-install-btn" style="
          background: #4CAF50;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        ">Install</button>
        <button id="pwa-dismiss-btn" style="
          background: transparent;
          color: #ccc;
          border: none;
          padding: 6px;
          cursor: pointer;
          font-size: 16px;
        ">×</button>
      </div>
      <style>
        @keyframes slideUp {
          from { transform: translateX(-50%) translateY(100%); opacity: 0; }
          to { transform: translateX(-50%) translateY(0); opacity: 1; }
        }
      </style>
    `;
    
    document.body.appendChild(installBanner);
    
    // Handle install button click
    document.getElementById('pwa-install-btn').addEventListener('click', async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log('User choice:', outcome);
        deferredPrompt = null;
        hideInstallPrompt();
      }
    });
    
    // Handle dismiss button click
    document.getElementById('pwa-dismiss-btn').addEventListener('click', () => {
      hideInstallPrompt();
      // Remember user dismissed the prompt
      localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    });
    
    // Auto-hide banner after 10 seconds
    setTimeout(() => {
      hideInstallPrompt();
    }, 10000);
  }
};

// Hide install prompt
const hideInstallPrompt = () => {
  const installBanner = document.getElementById('pwa-install-banner');
  if (installBanner) {
    installBanner.style.animation = 'slideDown 0.3s ease-in forwards';
    setTimeout(() => {
      installBanner.remove();
    }, 300);
  }
};

// Check if app is running as PWA
export const isPWA = () => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true ||
         document.referrer.includes('android-app://');
};

// Setup PWA features
export const initializePWA = () => {
  // Register service worker
  registerServiceWorker();
  
  // Setup install prompt (only show if not already installed and not recently dismissed)
  const lastDismissed = localStorage.getItem('pwa-install-dismissed');
  const daysSinceDismiss = lastDismissed ? (Date.now() - parseInt(lastDismissed)) / (1000 * 60 * 60 * 24) : 999;
  
  if (!isPWA() && daysSinceDismiss > 7) {
    setupPWAInstallPrompt();
  }
  
  // Add PWA-specific styles when running as standalone app
  if (isPWA()) {
    document.body.classList.add('pwa-mode');
    
    // Add PWA-specific CSS with safe fallbacks
    const pwaStyle = document.createElement('style');
    pwaStyle.textContent = `
      .pwa-mode {
        /* Add safe area insets for devices with notches - with fallbacks */
        padding-top: 0px;
        padding-top: env(safe-area-inset-top, 0px);
        padding-bottom: 20px;
        padding-bottom: env(safe-area-inset-bottom, 20px);
        padding-left: 0px;
        padding-left: env(safe-area-inset-left, 0px);
        padding-right: 0px;
        padding-right: env(safe-area-inset-right, 0px);
      }
      
      /* Specific adjustments for game containers */
      .pwa-mode .mtg-game-container {
        padding-bottom: 20px;
        padding-bottom: calc(0.5rem + env(safe-area-inset-bottom, 0px));
      }
      
      /* Hide browser UI elements that don't apply in PWA mode */
      .pwa-mode .browser-only {
        display: none !important;
      }
    `;
    document.head.appendChild(pwaStyle);
  }
};
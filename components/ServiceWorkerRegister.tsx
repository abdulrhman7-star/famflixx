'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    const registerSW = async () => {
      try {
        const existingRegistration = await navigator.serviceWorker.getRegistration('/');
        if (existingRegistration && existingRegistration.active) {
          existingRegistration.addEventListener('updatefound', () => {
            const installingWorker = existingRegistration.installing;
            if (installingWorker) {
              installingWorker.addEventListener('statechange', () => {
                if (
                  installingWorker.state === 'installed' &&
                  navigator.serviceWorker.controller
                ) {
                  window.dispatchEvent(new CustomEvent('pwa-update-available'));
                }
              });
            }
          });
          return;
        }

        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });

        registration.addEventListener('updatefound', () => {
          const installingWorker = registration.installing;
          if (installingWorker) {
            installingWorker.addEventListener('statechange', () => {
              if (
                installingWorker.state === 'installed' &&
                navigator.serviceWorker.controller
              ) {
                window.dispatchEvent(new CustomEvent('pwa-update-available'));
              }
            });
          }
        });
      } catch (error) {
        console.error('Service worker registration failed:', error);
      }
    };

    if (document.readyState === 'complete') {
      registerSW();
    } else {
      window.addEventListener('load', registerSW);
      return () => window.removeEventListener('load', registerSW);
    }
  }, []);

  return null;
}

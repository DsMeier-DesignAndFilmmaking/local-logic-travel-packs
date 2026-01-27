/**
 * Dev-only utility to clear all service workers
 * 
 * Run this in browser console during development to clear stale service workers:
 * 
 * navigator.serviceWorker.getRegistrations().then(regs => {
 *   regs.forEach(r => {
 *     console.log('Unregistering:', r.scope);
 *     r.unregister();
 *   });
 * });
 * 
 * Or use this script via Node.js (if needed):
 */

if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(regs => {
    console.log(`Found ${regs.length} service worker(s) to unregister`);
    regs.forEach(r => {
      console.log('Unregistering:', r.scope);
      r.unregister().then(success => {
        if (success) {
          console.log('✅ Unregistered:', r.scope);
        } else {
          console.warn('⚠️ Failed to unregister:', r.scope);
        }
      });
    });
  });
} else {
  console.log('Service workers not available in this environment');
}

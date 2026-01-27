# Service Worker Cleanup (Dev Only)

During development, you may need to clear stale service workers to test fresh registrations.

## Browser Console Method (Recommended)

Open your browser's developer console and run:

```javascript
navigator.serviceWorker.getRegistrations().then(regs => {
  console.log(`Found ${regs.length} service worker(s)`);
  regs.forEach(r => {
    console.log('Unregistering:', r.scope);
    r.unregister().then(success => {
      console.log(success ? '✅ Unregistered:' : '⚠️ Failed:', r.scope);
    });
  });
});
```

## Chrome DevTools Method

1. Open Chrome DevTools (F12)
2. Go to **Application** tab
3. Click **Service Workers** in the left sidebar
4. Click **Unregister** for each service worker listed
5. Refresh the page

## When to Use

- After changing service worker scope logic
- When testing city-specific service worker registration
- If navigation seems stuck or service worker is interfering
- Before testing fresh PWA installations

## Important Notes

- This is for **development only**
- Production users should not need to clear service workers
- Clearing service workers will remove cached data for that scope
- The app will fall back to IndexedDB for offline access if SW is unavailable

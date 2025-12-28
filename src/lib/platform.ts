export function isNativePlatform() {
  if (typeof window === 'undefined') return false;
  // Check for Capacitor
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (window as any).Capacitor?.isNativePlatform() || false;
}

export function isIOS() {
  if (typeof window === 'undefined') return false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

export function isAndroid() {
  if (typeof window === 'undefined') return false;
  return /Android/.test(navigator.userAgent);
}

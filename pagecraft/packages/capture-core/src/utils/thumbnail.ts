export function buildPlaceholderThumbnail(title: string, accent = "#155EEF"): string {
  const safeTitle = title.replace(/[<&>]/g, "");
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="720" viewBox="0 0 1200 720">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#F7F3EB"/>
          <stop offset="100%" stop-color="#E7EEF9"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="720" fill="url(#bg)"/>
      <rect x="72" y="64" width="1056" height="592" rx="32" fill="#FFFFFF" stroke="#D7DEEB"/>
      <rect x="120" y="118" width="240" height="18" rx="9" fill="${accent}" opacity="0.16"/>
      <rect x="120" y="168" width="760" height="56" rx="20" fill="${accent}" opacity="0.08"/>
      <rect x="120" y="260" width="960" height="220" rx="28" fill="${accent}" opacity="0.08"/>
      <rect x="120" y="514" width="280" height="70" rx="20" fill="${accent}" opacity="0.12"/>
      <text x="120" y="210" font-family="Segoe UI, Arial, sans-serif" font-size="42" font-weight="700" fill="#172132">${safeTitle}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

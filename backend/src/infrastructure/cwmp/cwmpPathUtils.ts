/** Natural sort for TR-098 paths (WLANConfiguration.2 before .10). */
export function compareCwmpPaths(a: string, b: string): number {
  const aParts = a.split('.');
  const bParts = b.split('.');
  const len = Math.max(aParts.length, bParts.length);
  for (let i = 0; i < len; i++) {
    const ap = aParts[i] ?? '';
    const bp = bParts[i] ?? '';
    if (ap === bp) continue;
    const an = /^\d+$/.test(ap) ? parseInt(ap, 10) : Number.NaN;
    const bn = /^\d+$/.test(bp) ? parseInt(bp, 10) : Number.NaN;
    if (!Number.isNaN(an) && !Number.isNaN(bn)) return an - bn;
    return ap.localeCompare(bp);
  }
  return 0;
}

export function expandCwmpParameterPaths(requested: string[], allPaths: string[]): string[] {
  const expanded = new Set<string>();

  for (const path of requested) {
    if (!path) continue;
    const normalized = path.endsWith('.') ? path : path;
    if (normalized.endsWith('.') || normalized === 'InternetGatewayDevice') {
      const prefix = normalized.endsWith('.') ? normalized : `${normalized}.`;
      for (const p of allPaths) {
        if (p.startsWith(prefix)) expanded.add(p);
      }
    } else {
      if (allPaths.includes(normalized)) {
        expanded.add(normalized);
      } else {
        const prefix = `${normalized}.`;
        const children = allPaths.filter((p) => p.startsWith(prefix));
        if (children.length > 0) {
          for (const c of children) expanded.add(c);
        } else {
          expanded.add(normalized);
        }
      }
    }
  }

  return Array.from(expanded).sort(compareCwmpPaths);
}

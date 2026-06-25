export const PROTOCOL_OPTIONS = [
  { value: 'TCP', label: 'TCP' },
  { value: 'UDP', label: 'UDP' },
  { value: 'BOTH', label: 'Both' },
] as const;

export type ProtocolOption = (typeof PROTOCOL_OPTIONS)[number]['value'];

const PROTECTED_HTTP_PORTS = new Set(['80', '443']);

/** Inbound TCP allow rules for web management (HTTP/HTTPS) cannot be deleted. */
export function isProtectedFirewallRule(rule: {
  direction: string;
  protocol: string;
  destPort: string;
  action: string;
}): boolean {
  return (
    rule.direction === 'inbound' &&
    rule.protocol === 'TCP' &&
    rule.action === 'allow' &&
    PROTECTED_HTTP_PORTS.has(rule.destPort)
  );
}

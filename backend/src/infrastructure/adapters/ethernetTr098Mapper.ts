import { TR098_LAN_ETHERNET, type CwmpParameterValue } from '@aerobrry/shared';

const LAN_PORT_MACS = [
  '00:1A:2B:3C:4D:61',
  '00:1A:2B:3C:4D:62',
  '00:1A:2B:3C:4D:63',
  '00:1A:2B:3C:4D:64',
];

export function buildEthernetTr098Parameters(portCount = 4): CwmpParameterValue[] {
  const params: CwmpParameterValue[] = [
    { name: TR098_LAN_ETHERNET.NUMBER_OF_ENTRIES, value: String(portCount) },
  ];

  for (let i = 1; i <= portCount; i++) {
    const p = TR098_LAN_ETHERNET.port(i);
    params.push(
      { name: p.ENABLE, value: 'true' },
      { name: p.STATUS, value: i <= 2 ? 'Up' : 'NoLink' },
      { name: p.MAC_ADDRESS, value: LAN_PORT_MACS[i - 1] ?? LAN_PORT_MACS[0] },
      { name: p.MAX_BIT_RATE, value: '1000' },
      { name: p.DUPLEX_MODE, value: 'Full' },
      { name: p.NAME, value: `LAN${i}` },
    );
  }

  return params;
}

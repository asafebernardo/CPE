import { TR098_DIAGNOSTICS, type CwmpParameterValue } from '@aerobrry/shared';

export interface DiagnosticsState {
  ipPing: {
    diagnosticsState: string;
    interface: string;
    host: string;
    numberOfRepetitions: number;
    timeout: number;
    dataBlockSize: number;
    successCount: number;
    failureCount: number;
    averageResponseTime: number;
    minimumResponseTime: number;
    maximumResponseTime: number;
  };
  traceRoute: {
    diagnosticsState: string;
    interface: string;
    host: string;
    numberOfTries: number;
    timeout: number;
    dataBlockSize: number;
    maxHopCount: number;
    responseTime: number;
    hops: Array<{ host: string; rtt: number }>;
  };
  download: {
    diagnosticsState: string;
    interface: string;
    downloadUrl: string;
    dscp: number;
    ethernetPriority: number;
    romTime: string;
    bomTime: string;
    eomTime: string;
    totalBytesReceived: number;
    testBytesReceived: number;
  };
  upload: {
    diagnosticsState: string;
    interface: string;
    uploadUrl: string;
    dscp: number;
    ethernetPriority: number;
    totalBytesSent: number;
    testBytesSent: number;
  };
}

export function createDefaultDiagnosticsState(): DiagnosticsState {
  return {
    ipPing: {
      diagnosticsState: 'None',
      interface: '',
      host: '',
      numberOfRepetitions: 4,
      timeout: 1000,
      dataBlockSize: 64,
      successCount: 0,
      failureCount: 0,
      averageResponseTime: 0,
      minimumResponseTime: 0,
      maximumResponseTime: 0,
    },
    traceRoute: {
      diagnosticsState: 'None',
      interface: '',
      host: '',
      numberOfTries: 3,
      timeout: 5000,
      dataBlockSize: 38,
      maxHopCount: 30,
      responseTime: 0,
      hops: [],
    },
    download: {
      diagnosticsState: 'None',
      interface: '',
      downloadUrl: '',
      dscp: 0,
      ethernetPriority: 0,
      romTime: '',
      bomTime: '',
      eomTime: '',
      totalBytesReceived: 0,
      testBytesReceived: 0,
    },
    upload: {
      diagnosticsState: 'None',
      interface: '',
      uploadUrl: '',
      dscp: 0,
      ethernetPriority: 0,
      totalBytesSent: 0,
      testBytesSent: 0,
    },
  };
}

export function buildDiagnosticsTr098Parameters(state: DiagnosticsState): CwmpParameterValue[] {
  const ip = TR098_DIAGNOSTICS.IP_PING;
  const tr = TR098_DIAGNOSTICS.TRACE_ROUTE;
  const dl = TR098_DIAGNOSTICS.DOWNLOAD;
  const ul = TR098_DIAGNOSTICS.UPLOAD;

  const params: CwmpParameterValue[] = [
    { name: ip.DIAGNOSTICS_STATE, value: state.ipPing.diagnosticsState },
    { name: ip.INTERFACE, value: state.ipPing.interface },
    { name: ip.HOST, value: state.ipPing.host },
    { name: ip.NUMBER_OF_REPETITIONS, value: String(state.ipPing.numberOfRepetitions) },
    { name: ip.TIMEOUT, value: String(state.ipPing.timeout) },
    { name: ip.DATA_BLOCK_SIZE, value: String(state.ipPing.dataBlockSize) },
    { name: ip.SUCCESS_COUNT, value: String(state.ipPing.successCount) },
    { name: ip.FAILURE_COUNT, value: String(state.ipPing.failureCount) },
    { name: ip.AVERAGE_RESPONSE_TIME, value: String(state.ipPing.averageResponseTime) },
    { name: ip.MINIMUM_RESPONSE_TIME, value: String(state.ipPing.minimumResponseTime) },
    { name: ip.MAXIMUM_RESPONSE_TIME, value: String(state.ipPing.maximumResponseTime) },

    { name: tr.DIAGNOSTICS_STATE, value: state.traceRoute.diagnosticsState },
    { name: tr.INTERFACE, value: state.traceRoute.interface },
    { name: tr.HOST, value: state.traceRoute.host },
    { name: tr.NUMBER_OF_TRIES, value: String(state.traceRoute.numberOfTries) },
    { name: tr.TIMEOUT, value: String(state.traceRoute.timeout) },
    { name: tr.DATA_BLOCK_SIZE, value: String(state.traceRoute.dataBlockSize) },
    { name: tr.MAX_HOP_COUNT, value: String(state.traceRoute.maxHopCount) },
    { name: tr.RESPONSE_TIME, value: String(state.traceRoute.responseTime) },
    { name: tr.ROUTE_HOPS_NUMBER_OF_ENTRIES, value: String(state.traceRoute.hops.length) },
  ];

  state.traceRoute.hops.forEach((hop, idx) => {
    const h = tr.hop(idx + 1);
    params.push(
      { name: h.HOST, value: hop.host },
      { name: h.RT_TIMES, value: String(hop.rtt) },
    );
  });

  params.push(
    { name: dl.DIAGNOSTICS_STATE, value: state.download.diagnosticsState },
    { name: dl.INTERFACE, value: state.download.interface },
    { name: dl.DOWNLOAD_URL, value: state.download.downloadUrl },
    { name: dl.DSCP, value: String(state.download.dscp) },
    { name: dl.ETHERNET_PRIORITY, value: String(state.download.ethernetPriority) },
    { name: dl.ROM_TIME, value: state.download.romTime },
    { name: dl.BOM_TIME, value: state.download.bomTime },
    { name: dl.EOM_TIME, value: state.download.eomTime },
    { name: dl.TOTAL_BYTES_RECEIVED, value: String(state.download.totalBytesReceived) },
    { name: dl.TEST_BYTES_RECEIVED, value: String(state.download.testBytesReceived) },

    { name: ul.DIAGNOSTICS_STATE, value: state.upload.diagnosticsState },
    { name: ul.INTERFACE, value: state.upload.interface },
    { name: ul.UPLOAD_URL, value: state.upload.uploadUrl },
    { name: ul.DSCP, value: String(state.upload.dscp) },
    { name: ul.ETHERNET_PRIORITY, value: String(state.upload.ethernetPriority) },
    { name: ul.TOTAL_BYTES_SENT, value: String(state.upload.totalBytesSent) },
    { name: ul.TEST_BYTES_SENT, value: String(state.upload.testBytesSent) },
  );

  return params;
}

export function applyDiagnosticsParameterChange(
  state: DiagnosticsState,
  path: string,
  value: string,
): boolean {
  const setters: Array<[string, (v: string) => void]> = [
    [TR098_DIAGNOSTICS.IP_PING.DIAGNOSTICS_STATE, (v) => { state.ipPing.diagnosticsState = v; }],
    [TR098_DIAGNOSTICS.IP_PING.INTERFACE, (v) => { state.ipPing.interface = v; }],
    [TR098_DIAGNOSTICS.IP_PING.HOST, (v) => { state.ipPing.host = v; }],
    [TR098_DIAGNOSTICS.IP_PING.NUMBER_OF_REPETITIONS, (v) => { state.ipPing.numberOfRepetitions = parseInt(v, 10) || 4; }],
    [TR098_DIAGNOSTICS.IP_PING.TIMEOUT, (v) => { state.ipPing.timeout = parseInt(v, 10) || 1000; }],
    [TR098_DIAGNOSTICS.IP_PING.DATA_BLOCK_SIZE, (v) => { state.ipPing.dataBlockSize = parseInt(v, 10) || 64; }],

    [TR098_DIAGNOSTICS.TRACE_ROUTE.DIAGNOSTICS_STATE, (v) => { state.traceRoute.diagnosticsState = v; }],
    [TR098_DIAGNOSTICS.TRACE_ROUTE.INTERFACE, (v) => { state.traceRoute.interface = v; }],
    [TR098_DIAGNOSTICS.TRACE_ROUTE.HOST, (v) => { state.traceRoute.host = v; }],
    [TR098_DIAGNOSTICS.TRACE_ROUTE.NUMBER_OF_TRIES, (v) => { state.traceRoute.numberOfTries = parseInt(v, 10) || 3; }],
    [TR098_DIAGNOSTICS.TRACE_ROUTE.TIMEOUT, (v) => { state.traceRoute.timeout = parseInt(v, 10) || 5000; }],
    [TR098_DIAGNOSTICS.TRACE_ROUTE.MAX_HOP_COUNT, (v) => { state.traceRoute.maxHopCount = parseInt(v, 10) || 30; }],

    [TR098_DIAGNOSTICS.DOWNLOAD.DIAGNOSTICS_STATE, (v) => { state.download.diagnosticsState = v; }],
    [TR098_DIAGNOSTICS.DOWNLOAD.INTERFACE, (v) => { state.download.interface = v; }],
    [TR098_DIAGNOSTICS.DOWNLOAD.DOWNLOAD_URL, (v) => { state.download.downloadUrl = v; }],

    [TR098_DIAGNOSTICS.UPLOAD.DIAGNOSTICS_STATE, (v) => { state.upload.diagnosticsState = v; }],
    [TR098_DIAGNOSTICS.UPLOAD.INTERFACE, (v) => { state.upload.interface = v; }],
    [TR098_DIAGNOSTICS.UPLOAD.UPLOAD_URL, (v) => { state.upload.uploadUrl = v; }],
  ];

  const match = setters.find(([p]) => p === path);
  if (!match) return false;
  match[1](value);
  return true;
}

export function getRequestedDiagnostics(state: DiagnosticsState): 'ping' | 'trace' | 'download' | 'upload' | null {
  if (state.ipPing.diagnosticsState === 'Requested') return 'ping';
  if (state.traceRoute.diagnosticsState === 'Requested') return 'trace';
  if (state.download.diagnosticsState === 'Requested') return 'download';
  if (state.upload.diagnosticsState === 'Requested') return 'upload';
  return null;
}

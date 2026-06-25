import { TR098_X_ROUTERGUI, type CwmpParameterValue } from '@aerobrry/shared';

export interface OpticalTr098Source {
  rxPowerDbm: number;
  txPowerDbm: number;
  temperature: number;
  ponStatus: string;
  oltId: string;
}

export function buildOpticalTr098Parameters(source: OpticalTr098Source): CwmpParameterValue[] {
  const rx = source.rxPowerDbm.toFixed(2);
  const tx = source.txPowerDbm.toFixed(2);
  const temp = source.temperature.toFixed(1);
  return [
    { name: TR098_X_ROUTERGUI.OPTICAL_RX_POWER, value: rx },
    { name: TR098_X_ROUTERGUI.OPTICAL_TX_POWER, value: tx },
    { name: TR098_X_ROUTERGUI.OPTICAL_TEMPERATURE, value: temp },
    { name: TR098_X_ROUTERGUI.PON_STATUS, value: source.ponStatus },
    { name: TR098_X_ROUTERGUI.OLT_ID, value: source.oltId },
    { name: TR098_X_ROUTERGUI.WAN_OPTICAL_RX_POWER, value: rx },
    { name: TR098_X_ROUTERGUI.WAN_OPTICAL_TX_POWER, value: tx },
  ];
}

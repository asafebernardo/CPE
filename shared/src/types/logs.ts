export type LogType = 'LOGIN' | 'PARAM_CHANGE' | 'INFORM' | 'ACS_COMMAND' | 'SYSTEM' | 'DIAGNOSTIC' | 'SECURITY';

export interface LogEntry {
  id: string;
  deviceId: string;
  type: LogType;
  message: string;
  details?: string;
  createdAt: Date;
}

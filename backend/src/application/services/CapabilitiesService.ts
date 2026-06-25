import {
  DEFAULT_CAPABILITIES,
  type DeviceCapabilities,
  type DeviceProfile,
} from '@aerobrry/shared';
import { prisma } from '../../infrastructure/database/prisma.js';

function parseStored(raw: string | null | undefined): Partial<DeviceCapabilities> {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Partial<DeviceCapabilities>;
  } catch {
    return {};
  }
}

export class CapabilitiesService {
  async getCapabilities(deviceId: string): Promise<DeviceCapabilities> {
    const device = await prisma.virtualDevice.findUnique({ where: { id: deviceId } });
    if (!device) return { ...DEFAULT_CAPABILITIES };

    const stored = parseStored(device.capabilitiesJson);
    const inferred = await this.inferCapabilities(deviceId);

    return {
      ...DEFAULT_CAPABILITIES,
      ...inferred,
      ...stored,
      profile: (stored.profile ?? inferred.profile ?? DEFAULT_CAPABILITIES.profile) as DeviceProfile,
    };
  }

  private async inferCapabilities(deviceId: string): Promise<Partial<DeviceCapabilities>> {
    const [optical, vpn, qosRules, meshIfaces, session] = await Promise.all([
      prisma.opticalInfo.findUnique({ where: { deviceId } }),
      prisma.vpnConfig.findUnique({ where: { deviceId } }),
      prisma.qosRule.count({ where: { deviceId } }),
      prisma.wirelessInterface.count({ where: { deviceId, interfaceType: 'mesh_backhaul' } }),
      prisma.cwmpSession.findUnique({ where: { deviceId } }),
    ]);

    const profile: DeviceProfile = meshIfaces > 0 ? 'mesh_node' : session?.acsUrl ? 'isp' : 'enterprise';

    return {
      pon: Boolean(optical),
      sfp: Boolean(optical),
      vpn: Boolean(vpn?.enabled),
      qos: qosRules > 0,
      mesh: meshIfaces > 0,
      tr069: true,
      profile,
    };
  }
}

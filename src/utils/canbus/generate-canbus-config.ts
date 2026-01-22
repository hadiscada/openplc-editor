import type { ModbusIOGroup, PLCRemoteDevice } from '@root/types/PLC/open-plc'

// Struktur per Group/Pesan CAN (analog dengan Modbus IO Point)
interface CanMasterIOPoint {
  id: string
  type: 'DI' | 'DO' | 'AI' | 'AO' // Berdasarkan mapping modul
  node_id: number
  fc: number          // Kita gunakan FC 2 untuk DI, 15 untuk DO (konsisten dengan UI)
  offset: string      // Alamat objek/register
  len: number         // Jumlah bit/channel
  iec_location: string
}

interface CanMasterDevice {
  name: string
  node_id: number
  io_groups: CanMasterIOPoint[]
}

interface CanbusFinalConfig {
  canbus_enabled: string
  interface: string
  bitrate: number
  auto_restart: number
  devices: CanMasterDevice[] // Daftar remote device canbus
}

const formatOffsetAsHex = (offset: string): string => {
  const trimmed = offset.trim()
  if (trimmed.toLowerCase().startsWith('0x')) return trimmed
  const num = parseInt(trimmed, 10)
  return isNaN(num) ? '0x0000' : `0x${num.toString(16).toUpperCase().padStart(4, '0')}`
}

/**
 * Konversi IOGroup milik remote device menjadi spesifikasi IO CAN
 */
const convertIOGroupToCanIO = (ioGroup: ModbusIOGroup, nodeId: number): CanMasterIOPoint => {
  const firstIOPoint = ioGroup.ioPoints[0]
  const iecLocation = firstIOPoint?.iecLocation || '%IX0.0'

  // Deteksi tipe sederhana untuk runtime
  const type = ioGroup.functionCode === '2' ? 'DI' : 'DO'

  return {
    id: ioGroup.id,
    type: type,
    node_id: nodeId,
    fc: parseInt(ioGroup.functionCode, 10),
    offset: formatOffsetAsHex(ioGroup.offset),
    len: ioGroup.length,
    iec_location: iecLocation
  }
}

/**
 * Fungsi utama untuk men-generate file konfigurasi canbus.json
 */
export const generateCanbusConfig = (
  //conf: CanbusConfig | undefined,
  remoteDevices: PLCRemoteDevice[] | undefined
): string | null => {

  const canDevices = remoteDevices?.filter(d => d.protocol === 'canbus');

  if (!canDevices || canDevices.length === 0) {
    return null
  }

  // Map each OpenPLC Remote Device (CANbus) to a device entry in the config
  const mappedDevices: CanMasterDevice[] = canDevices.map(device => {
    const groups = device.modbusTcpConfig?.ioGroups || [];
    const deviceGroups: CanMasterIOPoint[] = [];

    groups.forEach(group => {
      // Prioritize the nodeId stored in the group.
      // Fallback: try to parse from group name, or device name, or default to 1.
      let nodeId = group.nodeId;
      if (nodeId === undefined) {
        const match = group.name.match(/Node(\d+)/);
        if (match) {
          nodeId = parseInt(match[1], 10);
        } else {
          const deviceMatch = device.name.match(/Node(\d+)/);
          nodeId = deviceMatch ? parseInt(deviceMatch[1], 10) : 1;
        }
      }

      deviceGroups.push(convertIOGroupToCanIO(group, nodeId));
    });

    return {
      name: device.name, // Use the name defined in the Remote Device editor
      node_id: 1, // Default to 1 (Master) for the container
      io_groups: deviceGroups
    };
  });

  const config: CanbusFinalConfig = {
    canbus_enabled: "true",
    interface: "can0",
    bitrate: 1000000,
    auto_restart: 100,
    devices: mappedDevices
  };

  // PASTIKAN: Hasil stringify ini dikonversi secara eksplisit ke string
  // untuk mencegah auto-conversion ke Buffer oleh library transportasi data
  const jsonString = JSON.stringify(config, null, 2);
  return jsonString.toString();
};

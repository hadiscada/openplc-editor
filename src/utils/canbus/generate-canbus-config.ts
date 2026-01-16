import type { PLCRemoteDevice, ModbusIOGroup } from '@root/types/PLC/open-plc'

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
  enable: boolean,
  //conf: CanbusConfig | undefined,
  remoteDevices: PLCRemoteDevice[] | undefined
): string => {
  const isEnabled = enable || false;

  const canDevices = remoteDevices?.filter(d => d.protocol === 'canbus') || [];

  const mappedDevices: CanMasterDevice[] = canDevices.map(device => {
    const groups = device.modbusTcpConfig?.ioGroups || [];
    
    // Gunakan fallback yang lebih aman untuk Node ID
    const nodeIdMatch = device.name.match(/Node(\d+)/);
    const nodeId = nodeIdMatch ? parseInt(nodeIdMatch[1], 10) : 1;

    return {
      name: device.name,
      node_id: nodeId,
      // Pastikan io_groups tidak kosong
      io_groups: groups.map(g => convertIOGroupToCanIO(g, nodeId))
    };
  });

  const config: CanbusFinalConfig = {
    canbus_enabled: isEnabled ? "true" : "false",
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
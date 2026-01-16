import { DeviceConfiguration } from '@root/types/PLC/devices'

// Default configuration for deviceDefinitions.configuration
export const defaultDeviceConfiguration: DeviceConfiguration = {
  deviceBoard: 'OpenPLC Runtime v3',
  communicationPort: '',
  runtimeIpAddress: '',
  compileOnly: false,
  communicationConfiguration: {
    modbusRTU: {
      rtuInterface: 'Serial',
      rtuBaudRate: '115200',
      rtuSlaveId: null,
      rtuRS485ENPin: null,
    },
    modbusTCP: {
      tcpInterface: 'Ethernet',
      tcpMacAddress: 'DE:AD:BE:EF:DE:AD',
      tcpStaticHostConfiguration: {
        ipAddress: '',
        dns: '',
        gateway: '',
        subnet: '',
      },
    },
    canBus:{
      canRate: '1000000',
    },
    communicationPreferences: {
      enabledRTU: false,
      enabledTCP: false,
      enabledDHCP: true,
      enabledCAN: false,
    },    
  },
}

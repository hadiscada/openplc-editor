import { communicationSelectors } from '@hooks/use-store-selectors'
import { Checkbox, Label } from '@root/renderer/components/_atoms'
import { DeviceEditorSlot } from '@root/renderer/components/_templates/[editors]'
import { useOpenPLCStore } from '@root/renderer/store'
import { cn, isOpenPLCRuntimeTarget } from '@root/utils'
import { useEffect, useMemo, useState } from 'react'

import { ModbusRTUComponent } from './components/modbus-rtu'
import { ModbusTCPComponent } from './components/modbus-tcp'

interface CANDevice {
  node_id: number;
  hex_id: string;
  product_code: string;
  type: string;
  vendor_id: string;
}

const Communication = () => {
  const {
    deviceDefinitions: {
      configuration: {
        deviceBoard,
        communicationConfiguration: { communicationPreferences },        
      },
    },
    deviceAvailableOptions: { availableBoards },
  } = useOpenPLCStore()

  const currentBoardInfo = availableBoards.get(deviceBoard)
  const isRuntimeTarget = isOpenPLCRuntimeTarget(currentBoardInfo)

  const isRTUEnabled = communicationPreferences.enabledRTU
  const isTCPEnabled = communicationPreferences.enabledTCP
  const isCANEnabled = communicationPreferences.enabledCAN

  const setCommunicationPreferences = communicationSelectors.useSetCommunicationPreferences()  
  const jwtToken = useOpenPLCStore((state) => state.runtimeConnection.jwtToken)
  const ipAddress = useOpenPLCStore((state) => state.deviceDefinitions.configuration.runtimeIpAddress)

  const [scanResults, setScanResults] = useState<CANDevice[] | null>(null)
  const [isScanning, setIsScanning] = useState(false)

  useEffect(() => {
    const updateModbusConfig = () => {
      if (isRuntimeTarget) {
        setCommunicationPreferences({ enableRTU: false })
        setCommunicationPreferences({ enableTCP: false })        
      }
    }
    updateModbusConfig()
  }, [deviceBoard, isRuntimeTarget])

  const handleEnableModbusRTU = () => {
    setCommunicationPreferences({ enableRTU: !isRTUEnabled })
  }
  const memoizedIsModbusRTUEnabled = useMemo(() => isRTUEnabled ?? false, [isRTUEnabled])

  const handleEnableModbusTCP = () => {
    setCommunicationPreferences({ enableTCP: !isTCPEnabled })
  }
  const memoizedIsModbusTCPEnabled = useMemo(() => isTCPEnabled ?? false, [isTCPEnabled])

  const handleEnableCAN = () => {
    setCommunicationPreferences({ enableCAN: !isCANEnabled })
  }
  //const memoizedIsCANEnabled = useMemo(() => isCANEnabled ?? false, [isCANEnabled])

  const handleScanCANbus = async () => {
    if (!ipAddress || !jwtToken) {
      //setErrorMsg("PLC IP Address or Token not found.");
      return;
    }

    setIsScanning(true);
    setScanResults(null);
    //setErrorMsg(null);
    
    try {
      const result = await window.bridge.runtimeScanCanbus(ipAddress, jwtToken);

      if (result.success && result.devices) {
        // Pastikan data di-cast ke tipe CANDevice[] untuk menghindari 'unsafe argument'
        setScanResults(result.devices as CANDevice[]);
      } else {
        //setErrorMsg(result.error || "Failed to scan CANbus.");
        setScanResults([]); 
      }
    } catch (err: unknown) {
      // Gunakan '_err' atau 'err' dan pastikan tipenya 'unknown' (standar TS terbaru)
      //const errorMessage = err instanceof Error ? err.message : String(err);
      //setErrorMsg("System error: " + errorMessage);
      console.error(err); // Menggunakan variabel agar tidak kena error 'unused-vars'
    } finally {
      setIsScanning(false);
    }
  };

  const getVendorName = (vendorId: string): string => {
    if (vendorId === "0x5f4") return "Winenerji";
    return vendorId; // Kembalikan ID asli jika tidak cocok
  };

  const getProductName = (productCode: string): string => {
    // Menangani string "0x1" atau angka 1
    if (productCode === "0x1" || productCode === "1") return "GPA116";
    if (productCode === "0x2" || productCode === "2") return "GPA216";
    return productCode;
  };

  const getProductType = (productCode: string): string => {
    // Menangani string "0x1" atau angka 1
    if (productCode === "0x1" || productCode === "1") return "Digital Output 16 Channel";
    if (productCode === "0x2" || productCode === "2") return "Digital Input 16 Channel";
    return productCode;
  };

  return (
    <DeviceEditorSlot heading='Communication'>
      <div id='modbus-rtu-container' className='flex h-fit w-full flex-col gap-4'>
        <div
          id='enable-modbus-rtu'
          className={cn('flex select-none items-center gap-2', !isRTUEnabled && 'opacity-50')}
        >
          <Checkbox
            id='enable-modbus-rtu-checkbox'
            className={isRTUEnabled ? 'border-brand' : 'border-neutral-300'}
            checked={isRTUEnabled}
            disabled={isRuntimeTarget}
            onCheckedChange={handleEnableModbusRTU}
          />
          <Label
            htmlFor='enable-modbus-rtu-checkbox'
            className='text-sm font-medium text-neutral-950 hover:cursor-pointer dark:text-white'
          >
            Enable Modbus RTU
          </Label>
        </div>
        <ModbusRTUComponent isModbusRTUEnabled={memoizedIsModbusRTUEnabled} />
      </div>
      <hr id='container-split' className='h-[1px] w-full self-stretch bg-brand-light' />
      <div id='modbus-tcp-container' className='flex h-fit w-full flex-col gap-4'>
        <div
          id='enable-modbus-tcp'
          className={cn('flex select-none items-center gap-2', !isTCPEnabled && 'opacity-50')}
        >
          <Checkbox
            id='enable-modbus-tcp-checkbox'
            className={isTCPEnabled ? 'border-brand' : 'border-neutral-300'}
            checked={isTCPEnabled}
            disabled={isRuntimeTarget}
            onCheckedChange={handleEnableModbusTCP}
          />
          <Label
            htmlFor='enable-modbus-tcp-checkbox'
            className='text-sm font-medium text-neutral-950 hover:cursor-pointer dark:text-white'
          >
            Enable Modbus TCP
          </Label>
        </div>
        <ModbusTCPComponent isModbusTCPEnabled={memoizedIsModbusTCPEnabled} />
      </div>

      <hr id='container-split-2' className='h-[1px] w-full self-stretch bg-brand-light' />

      <div id='canbus-container' className='flex h-fit w-full flex-col gap-2'>
        <div
          id='enable-canbus'
          className={cn('flex select-none items-center gap-2', !isCANEnabled && 'opacity-50')}
        >
          <Checkbox
            id='enable-canbus-checkbox'
            className={isCANEnabled ? 'border-brand' : 'border-neutral-300'}
            checked={isCANEnabled}
            // Karena CM5 adalah runtime target, pastikan logic disabled ini sesuai
            // Jika ingin selalu bisa diaktifkan di CM5, hapus disabled={isRuntimeTarget}
            onCheckedChange={handleEnableCAN}
          />
          <Label
            htmlFor='enable-canbus-checkbox'
            className='text-sm font-medium text-neutral-950 hover:cursor-pointer dark:text-white'
          >
            Enable CANbus Interface
          </Label>
        </div>        
        
        {isCANEnabled && (
          <div id='can-scan-action' className='mt-1 flex w-full flex-col pl-6 anim-fade-in gap-3'>
            <button
              type='button'
              // Tombol akan otomatis disable jika isScanning bernilai true
              disabled={isScanning}
              className={cn(
                'h-[30px] w-fit rounded-md bg-brand px-4 py-1 font-caption text-cp-sm font-medium text-[11px] text-white transition-all',
                'hover:bg-brand-medium-dark',
                // Tambahkan style visual saat disabled (opsional)
                'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-neutral-400'
              )}
              onClick={() => {
                void handleScanCANbus();
              }}
            >
              {/* Teks berubah secara dinamis sesuai status loading */}
              {isScanning ? (
                <span className="flex items-center gap-2">
                  {/* Anda bisa menambahkan ikon spinner di sini nanti */}
                  Scanning...
                </span>
              ) : (
                'Scan I/O Module'
              )}
            </button>

            {/* TABEL HASIL SCAN */}
            {scanResults && scanResults.length > 0 && (
              <div className='w-full overflow-hidden rounded-md border border-neutral-200 bg-white dark:bg-neutral-900'>
                <table className='w-full text-left text-xs'>
                  <thead className='bg-neutral-100 dark:bg-neutral-800 uppercase text-neutral-500 font-semibold'>
                    <tr>
                      <th className='px-3 py-2'>Node ID</th>
                      <th className='px-3 py-2'>Vendor ID</th>
                      <th className='px-3 py-2'>Product Code</th>
                      <th className='px-3 py-2'>Type</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-neutral-100 dark:divide-neutral-800'>
                    {scanResults.map((dev: CANDevice) => (
                      <tr key={dev.node_id} className='hover:bg-neutral-50 dark:hover:bg-neutral-800/50'>
                        <td className='px-3 py-2 font-medium'>{dev.node_id}</td>
                        <td className='px-3 py-2 text-brand font-mono'>{getVendorName(dev.vendor_id)}</td>
                        <td className='px-3 py-2 font-mono'>{getProductName(dev.product_code)}</td>
                        <td className='px-3 py-2 text-neutral-600'>{getProductType(dev.product_code)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          </div>
        )}        
        
        
      </div>

    </DeviceEditorSlot>
  )
}

export { Communication }

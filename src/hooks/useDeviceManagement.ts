
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TrustedDevice {
  id: string;
  device_name: string;
  device_fingerprint: string;
  last_used_at: string;
  created_at: string;
}

export const useDeviceManagement = () => {
  const [trustedDevices, setTrustedDevices] = useState<TrustedDevice[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const generateDeviceFingerprint = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Device fingerprint', 2, 2);
    }
    
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL()
    ].join('|');
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  };

  const getCurrentDeviceName = () => {
    const platform = navigator.platform;
    const userAgent = navigator.userAgent;
    
    if (userAgent.includes('Chrome')) return `Chrome on ${platform}`;
    if (userAgent.includes('Firefox')) return `Firefox on ${platform}`;
    if (userAgent.includes('Safari')) return `Safari on ${platform}`;
    if (userAgent.includes('Edge')) return `Edge on ${platform}`;
    
    return `Browser on ${platform}`;
  };

  const isCurrentDeviceTrusted = () => {
    const deviceFingerprint = generateDeviceFingerprint();
    return localStorage.getItem(`trusted_device_${deviceFingerprint}`) === 'true';
  };

  const trustCurrentDevice = () => {
    const deviceFingerprint = generateDeviceFingerprint();
    const deviceName = getCurrentDeviceName();
    
    localStorage.setItem(`trusted_device_${deviceFingerprint}`, 'true');
    localStorage.setItem(`device_name_${deviceFingerprint}`, deviceName);
    localStorage.setItem('device_fingerprint', deviceFingerprint);
    
    console.log('✅ Device marked as trusted:', deviceName);
  };

  const untrustCurrentDevice = () => {
    const deviceFingerprint = generateDeviceFingerprint();
    
    localStorage.removeItem(`trusted_device_${deviceFingerprint}`);
    localStorage.removeItem(`device_name_${deviceFingerprint}`);
    localStorage.removeItem('device_fingerprint');
    
    console.log('❌ Device untrusted');
  };

  const loadTrustedDevices = async () => {
    setIsLoading(true);
    try {
      // This would typically fetch from a backend API
      // For now, we'll use localStorage to simulate device storage
      const devices: TrustedDevice[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('trusted_device_')) {
          const fingerprint = key.replace('trusted_device_', '');
          const deviceName = localStorage.getItem(`device_name_${fingerprint}`) || 'Unknown Device';
          
          devices.push({
            id: fingerprint,
            device_name: deviceName,
            device_fingerprint: fingerprint,
            last_used_at: new Date().toISOString(),
            created_at: new Date().toISOString()
          });
        }
      }
      
      setTrustedDevices(devices);
    } catch (error) {
      console.error('Error loading trusted devices:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const removeDevice = (deviceId: string) => {
    localStorage.removeItem(`trusted_device_${deviceId}`);
    localStorage.removeItem(`device_name_${deviceId}`);
    setTrustedDevices(prev => prev.filter(device => device.id !== deviceId));
  };

  useEffect(() => {
    loadTrustedDevices();
  }, []);

  return {
    trustedDevices,
    isLoading,
    isCurrentDeviceTrusted,
    trustCurrentDevice,
    untrustCurrentDevice,
    removeDevice,
    loadTrustedDevices,
    generateDeviceFingerprint,
    getCurrentDeviceName
  };
};

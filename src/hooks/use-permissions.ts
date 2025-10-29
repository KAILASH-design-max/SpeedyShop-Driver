
"use client";

import { useState, useEffect, useCallback } from 'react';

export type PermissionName = 'geolocation' | 'camera' | 'notifications';
export type PermissionState = 'granted' | 'prompt' | 'denied';

const usePermission = (permissionName: PermissionName) => {
    const [status, setStatus] = useState<PermissionState>('prompt');

    const checkPermission = useCallback(async () => {
        if ('permissions' in navigator) {
            try {
                const permissionStatus = await navigator.permissions.query({ name: permissionName as any });
                setStatus(permissionStatus.state);
                
                permissionStatus.onchange = () => {
                    setStatus(permissionStatus.state);
                };

            } catch (error) {
                // This can happen if the permission is not supported by the browser (e.g. Safari and camera)
                // In such cases, we might have to infer it. For now, assume 'prompt'.
                console.warn(`Could not query permission for ${permissionName}:`, error);
                if (permissionName === 'camera') {
                    // Try a different method for camera, especially for Safari
                    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
                        try {
                            const devices = await navigator.mediaDevices.enumerateDevices();
                            const hasCamera = devices.some(device => device.kind === 'videoinput');
                            if (hasCamera) {
                                // If a device label is present, we have permission.
                                const hasPermission = devices.some(d => d.kind === 'videoinput' && d.label);
                                setStatus(hasPermission ? 'granted' : 'prompt');
                            } else {
                                setStatus('denied'); // No camera hardware
                            }
                        } catch {
                             setStatus('prompt');
                        }
                    }
                } else {
                    setStatus('prompt');
                }
            }
        } else {
            console.warn('Permissions API not supported in this browser.');
            setStatus('prompt'); // Fallback for older browsers
        }
    }, [permissionName]);
    
    useEffect(() => {
        checkPermission();
    }, [checkPermission]);

    return status;
};

export const useAppPermissions = () => {
    const locationStatus = usePermission('geolocation');
    const cameraStatus = usePermission('camera');
    const notificationStatus = usePermission('notifications');

    return {
        location: locationStatus,
        camera: cameraStatus,
        notifications: notificationStatus
    };
};

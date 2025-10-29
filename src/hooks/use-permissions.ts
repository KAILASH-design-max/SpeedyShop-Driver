
"use client";

import { useState, useEffect, useCallback } from 'react';

export type PermissionName = 'geolocation' | 'camera' | 'notifications';
export type PermissionState = 'granted' | 'prompt' | 'denied';

const requestPermission = async (permissionName: PermissionName) => {
    try {
        switch (permissionName) {
            case 'geolocation':
                await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                        enableHighAccuracy: true,
                        timeout: 5000,
                        maximumAge: 0
                    });
                });
                break;
            case 'camera':
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                // We need to immediately stop the track to turn off the camera light
                stream.getTracks().forEach(track => track.stop());
                break;
            case 'notifications':
                await Notification.requestPermission();
                break;
        }
    } catch (error) {
        console.error(`Error requesting permission for ${permissionName}:`, error);
        // The checkPermission function will automatically pick up the 'denied' state.
    }
};

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
                console.warn(`Could not query permission for ${permissionName}:`, error);
                if (permissionName === 'camera') {
                    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
                        try {
                            const devices = await navigator.mediaDevices.enumerateDevices();
                            const hasCamera = devices.some(device => device.kind === 'videoinput');
                            if (hasCamera) {
                                const hasPermission = devices.some(d => d.kind === 'videoinput' && d.label);
                                setStatus(hasPermission ? 'granted' : 'prompt');
                            } else {
                                setStatus('denied');
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
            setStatus('prompt');
        }
    }, [permissionName]);
    
    useEffect(() => {
        checkPermission();
    }, [checkPermission]);

    const request = useCallback(async () => {
        await requestPermission(permissionName);
        await checkPermission(); // Re-check permission status after requesting
    }, [permissionName, checkPermission]);

    return { status, request };
};

export const useAppPermissions = () => {
    const location = usePermission('geolocation');
    const camera = usePermission('camera');
    const notifications = usePermission('notifications');

    return {
        location,
        camera,
        notifications
    };
};

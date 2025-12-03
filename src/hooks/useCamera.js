/**
 * Custom hook for camera access and management
 */

import { useState, useEffect, useRef } from 'react';

export function useCamera(initialFacingMode = 'user') {
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [facingMode, setFacingMode] = useState(initialFacingMode);
  const [isInitialized, setIsInitialized] = useState(false);
  const videoRef = useRef(null);

  // Enumerate available camera devices
  const enumerateDevices = async () => {
    try {
      const deviceList = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = deviceList.filter(device => device.kind === 'videoinput');
      console.log('Available cameras:', videoDevices);
      setDevices(videoDevices);
      
      if (videoDevices.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(videoDevices[0].deviceId);
      }
      
      return videoDevices;
    } catch (err) {
      console.error('Error enumerating devices:', err);
      return [];
    }
  };

  // Initial device enumeration (will have limited info until permission granted)
  useEffect(() => {
    let mounted = true;
    
    const loadDevices = async () => {
      if (mounted) {
        await enumerateDevices();
      }
    };
    
    loadDevices();
    
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Start camera with specified constraints
  const startCamera = async (deviceId = null, customFacingMode = null) => {
    try {
      // Stop existing stream if any
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const constraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30, max: 60 },
        }
      };

      // Use device ID if provided, otherwise use facing mode
      if (deviceId) {
        constraints.video.deviceId = { exact: deviceId };
      } else if (customFacingMode || facingMode) {
        constraints.video.facingMode = customFacingMode || facingMode;
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      setError(null);
      setIsInitialized(true);

      // Re-enumerate devices after permission granted (mobile needs this)
      await enumerateDevices();

      // Attach stream to video element if ref exists
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      return mediaStream;
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError(err.message);
      setIsInitialized(false);
      return null;
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsInitialized(false);
      
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  };

  // Switch camera (front/back)
  const switchCamera = async () => {
    const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacingMode);
    await startCamera(null, newFacingMode);
  };

  // Change camera by device ID
  const changeCamera = async (deviceId) => {
    setSelectedDeviceId(deviceId);
    await startCamera(deviceId);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  return {
    stream,
    error,
    devices,
    selectedDeviceId,
    facingMode,
    isInitialized,
    videoRef,
    startCamera,
    stopCamera,
    switchCamera,
    changeCamera,
  };
}

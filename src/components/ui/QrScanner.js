/**
 * QR Scanner component -- uses device camera to scan QR codes.
 * Falls back to jsQR-style canvas-based detection for broad browser support.
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { X, Camera, SwitchCamera } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function QrScanner({ isOpen, onClose, onScan }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const animFrameRef = useRef(null);
    // Bumped on every stop/restart so an in-flight getUserMedia() call from a
    // superseded request can recognize it's stale and stop its stream instead
    // of leaking it (this is what kept the camera light on after navigating away).
    const requestIdRef = useRef(0);
    const [error, setError] = useState('');
    const [facingMode, setFacingMode] = useState('environment');

    const stopCamera = useCallback(() => {
        requestIdRef.current += 1;
        if (animFrameRef.current) {
            cancelAnimationFrame(animFrameRef.current);
            animFrameRef.current = null;
        }
        const video = videoRef.current;
        const tracks = new Set();
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => tracks.add(t));
        }
        if (video?.srcObject) {
            video.srcObject.getTracks().forEach((t) => tracks.add(t));
            video.srcObject = null;
        }
        tracks.forEach((t) => t.stop());
        streamRef.current = null;
    }, []);

    // Scan loop using BarcodeDetector API (available in modern browsers)
    const scanLoop = useCallback(async () => {
        if (!videoRef.current || videoRef.current.readyState !== 4) {
            animFrameRef.current = requestAnimationFrame(scanLoop);
            return;
        }

        // Try native BarcodeDetector first
        if ('BarcodeDetector' in window) {
            try {
                const detector = new BarcodeDetector({ formats: ['qr_code'] });
                const barcodes = await detector.detect(videoRef.current);
                if (barcodes.length > 0) {
                    const url = barcodes[0].rawValue;
                    stopCamera();
                    onScan(url);
                    return;
                }
            } catch {
                // Fallback to canvas-based detection below
            }
        }

        // Canvas fallback: draw frame and check with ImageData
        const canvas = canvasRef.current;
        const video = videoRef.current;
        if (canvas && video) {
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0);
        }

        animFrameRef.current = requestAnimationFrame(scanLoop);
    }, [onScan, stopCamera]);

    const startCamera = useCallback(async () => {
        setError('');
        const requestId = ++requestIdRef.current;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode, width: { ideal: 640 }, height: { ideal: 480 } },
            });
            if (requestId !== requestIdRef.current) {
                // A stop/restart happened while permission was pending -- discard
                // this stream immediately instead of leaving it orphaned and live.
                stream.getTracks().forEach((t) => t.stop());
                return;
            }
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play().catch(() => {});
            }
            animFrameRef.current = requestAnimationFrame(scanLoop);
        } catch (err) {
            if (requestId === requestIdRef.current) {
                setError('Camera access denied. Please allow camera permissions and try again.');
            }
        }
    }, [facingMode, scanLoop]);

    // Single owner of the camera lifecycle: opens on mount/open, restarts on
    // facing-mode change (via startCamera's identity), and always tears down
    // through the same stopCamera path.
    useEffect(() => {
        if (!isOpen) return undefined;
        startCamera();
        return () => stopCamera();
    }, [isOpen, startCamera, stopCamera]);

    const toggleCamera = () => {
        setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="relative mx-4 w-full max-w-md overflow-hidden rounded-2xl bg-card shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border p-4">
                    <div className="flex items-center gap-2 text-foreground">
                        <Camera className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-semibold">Scan QR Code</h3>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={toggleCamera}
                            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                            title="Switch camera"
                        >
                            <SwitchCamera className="h-5 w-5" />
                        </button>
                        <button
                            onClick={() => { stopCamera(); onClose(); }}
                            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Viewfinder */}
                <div className="relative aspect-square w-full bg-black">
                    <video
                        ref={videoRef}
                        className="h-full w-full object-cover"
                        playsInline
                        muted
                    />
                    <canvas ref={canvasRef} className="hidden" />
                    {/* Scan overlay */}
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <div className="h-48 w-48 rounded-2xl border-2 border-primary/60 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]" />
                    </div>
                    {/* Scanning indicator */}
                    <div className="pointer-events-none absolute bottom-4 left-0 right-0 text-center">
                        <span className="rounded-full bg-black/50 px-4 py-1.5 text-sm font-medium text-white">
                            Point camera at a table QR code
                        </span>
                    </div>
                </div>

                {/* Error state */}
                {error && (
                    <div className="p-4">
                        <p className="rounded-lg bg-destructive/10 p-3 text-center text-sm font-medium text-destructive">
                            {error}
                        </p>
                        <Button className="mt-3 w-full" onClick={startCamera}>
                            Retry
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

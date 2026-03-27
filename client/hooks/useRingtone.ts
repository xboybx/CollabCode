import { useEffect, useRef } from 'react';

// -------------------------------------------------------
// Ringtone Hook — Web Audio API (no mp3 file needed).
//
// WHY NOT HTML5 Audio?
//   Browsers block audio from playing unless the user has
//   recently clicked something on THAT tab (autoplay policy).
//   When a socket event fires on a background tab, no click
//   has happened recently, so audio.play() silently fails.
//
// THE FIX — Pre-unlock the AudioContext:
//   We create the AudioContext on the FIRST user click on the page.
//   Once created, it stays "unlocked" forever in that session.
//   So when the socket event fires later, the context is already
//   ready and plays instantly without needing another user gesture.
// -------------------------------------------------------
export const useRingtone = () => {
    const audioCtxRef = useRef<AudioContext | null>(null);
    const ringtoneIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // On first click anywhere on the page, create and resume the AudioContext.
    // This satisfies the browser's "user gesture" requirement for audio.
    useEffect(() => {
        const unlock = () => {
            if (!audioCtxRef.current) {
                const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
                audioCtxRef.current = new AudioCtx();
                console.log("[🔊 AUDIO] AudioContext unlocked and ready.");
            }
            if (audioCtxRef.current.state === "suspended") {
                audioCtxRef.current.resume();
            }
        };
        document.addEventListener("click", unlock, { once: true });
        return () => document.removeEventListener("click", unlock);
    }, []);

    const playRingtone = () => {
        // First, stop any existing ringtone to avoid overlapping IDs
        stopRingtone();

        // If user never clicked (very rare), create context now
        if (!audioCtxRef.current) {
            const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
            audioCtxRef.current = new AudioCtx();
        }
        const ctx = audioCtxRef.current;
        if (!ctx) return;

        const beep = () => {
            // Two-tone phone ring: 480Hz + 620Hz simultaneously (classic US phone ring)
            [480, 620].forEach(freq => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.frequency.setValueAtTime(freq, ctx.currentTime);
                gain.gain.setValueAtTime(0.3, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.8);
            });
        };

        beep(); // play immediately
        ringtoneIntervalRef.current = setInterval(beep, 1800); // repeat every 1.8s
    };

    const stopRingtone = () => {
        if (ringtoneIntervalRef.current) {
            clearInterval(ringtoneIntervalRef.current);
            ringtoneIntervalRef.current = null;
        }
    };

    return { playRingtone, stopRingtone };
};

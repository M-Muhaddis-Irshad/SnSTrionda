"use client";

// =============================================================================
// useChatNotificationSound — plays a subtle chime when a chat message arrives
// for a session the user is NOT currently viewing.
// =============================================================================

import { useCallback, useRef } from "react";

export function useChatNotificationSound() {
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playChime = useCallback(() => {
    try {
      const ctx = audioCtxRef.current || new AudioContext();
      audioCtxRef.current = ctx;

      // Two-tone pleasant chime (C5 → E5)
      const now = ctx.currentTime;

      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(1047, now); // C5
      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.15, now + 0.05);
      gain1.gain.linearRampToValueAtTime(0, now + 0.3);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.3);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(1319, now + 0.15); // E5
      gain2.gain.setValueAtTime(0, now + 0.15);
      gain2.gain.linearRampToValueAtTime(0.12, now + 0.2);
      gain2.gain.linearRampToValueAtTime(0, now + 0.55);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.15);
      osc2.stop(now + 0.55);
    } catch {
      // Web Audio not available — silent fallback
    }
  }, []);

  return { playChime };
}

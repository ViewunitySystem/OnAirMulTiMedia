import { describe, it, expect, vi } from 'vitest';
import { mirror, detectSwipe, type MirrorInput, type SwipeContext } from '../src/mirror';

describe('SignalMirror', () => {
  describe('mirror function', () => {
    it('should process RF signals with swipe enhancement', async () => {
      const input: MirrorInput = {
        source: 'rf',
        target: 'webrtc',
        payload: { frequency: 433.92, data: 'test-data' },
        swipe: {
          gesture: 'swipe-up',
          intensity: 0.8,
          duration: 150,
          position: { x: 100, y: 200 }
        }
      };

      const result = await mirror(input);

      expect(result.event).toBe('MIRROR_COMPLETED');
      expect(result.source).toBe('rf');
      expect(result.target).toBe('webrtc');
      expect(result.license.status).toBe('valid');
      expect(result.license.region).toBe('EU');
      expect(result.swipe).toEqual(input.swipe);
      expect(result.performance.latency).toBeGreaterThan(0);
      expect(result.hash).toMatch(/^sha256:/);
    });

    it('should process SMS messages with priority based on swipe', async () => {
      const input: MirrorInput = {
        source: 'sms',
        target: 'canvas',
        payload: { text: 'Hello World' },
        swipe: {
          gesture: 'swipe-up',
          intensity: 0.9,
          duration: 200,
          position: { x: 50, y: 100 }
        }
      };

      const result = await mirror(input);

      expect(result.event).toBe('MIRROR_COMPLETED');
      expect(result.source).toBe('sms');
      expect(result.target).toBe('canvas');
      expect(result.performance.quality).toMatch(/high|medium|low/);
    });

    it('should handle WebRTC streams with quality adjustment', async () => {
      const input: MirrorInput = {
        source: 'webrtc',
        target: 'webrtc',
        payload: { stream: 'test-stream' },
        swipe: {
          gesture: 'tap',
          intensity: 0.3,
          duration: 100,
          position: { x: 200, y: 300 }
        }
      };

      const result = await mirror(input);

      expect(result.event).toBe('MIRROR_COMPLETED');
      expect(result.source).toBe('webrtc');
      expect(result.target).toBe('webrtc');
      expect(result.performance.throughput).toBeGreaterThan(0);
    });

    it('should handle errors gracefully', async () => {
      const input: MirrorInput = {
        source: 'invalid' as any,
        target: 'webrtc',
        payload: {}
      };

      const result = await mirror(input);

      expect(result.event).toBe('MIRROR_FAILED');
      expect(result.license.status).toBe('invalid');
      expect(result.performance.throughput).toBe(0);
    });

    it('should work without swipe context', async () => {
      const input: MirrorInput = {
        source: 'rf',
        target: 'canvas',
        payload: { frequency: 868.1, data: 'no-swipe' }
      };

      const result = await mirror(input);

      expect(result.event).toBe('MIRROR_COMPLETED');
      expect(result.swipe).toBeUndefined();
      expect(result.license.status).toBe('valid');
    });
  });

  describe('detectSwipe function', () => {
    it('should detect swipe from touch event', () => {
      const mockTouchEvent = {
        touches: [{ clientX: 150, clientY: 250 }],
        target: {
          getBoundingClientRect: () => ({ left: 0, top: 0 })
        }
      } as any;

      const swipe = detectSwipe(mockTouchEvent);

      expect(swipe).not.toBeNull();
      expect(swipe?.gesture).toBe('tap');
      expect(swipe?.intensity).toBe(0.5);
      expect(swipe?.position).toEqual({ x: 150, y: 250 });
    });

    it('should return null for invalid events', () => {
      const mockEvent = {} as TouchEvent;
      const swipe = detectSwipe(mockEvent);
      expect(swipe).toBeNull();
    });
  });

  describe('Performance metrics', () => {
    it('should calculate throughput correctly', async () => {
      const input: MirrorInput = {
        source: 'sms',
        target: 'webrtc',
        payload: { text: 'Performance test message' }
      };

      const result = await mirror(input);

      expect(result.performance.latency).toBeGreaterThan(0);
      expect(result.performance.throughput).toBeGreaterThan(0);
      expect(result.performance.quality).toMatch(/high|medium|low/);
    });
  });

  describe('License validation', () => {
    it('should always return EU-compliant license', async () => {
      const input: MirrorInput = {
        source: 'rf',
        target: 'canvas',
        payload: { frequency: 144.5, data: 'license-test' }
      };

      const result = await mirror(input);

      expect(result.license.region).toBe('EU');
      expect(result.license.status).toMatch(/valid|invalid/);
    });
  });
});

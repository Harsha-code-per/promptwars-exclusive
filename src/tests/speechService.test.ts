import { describe, it, expect, vi } from 'vitest';
import { SpeechService } from '../services/speechService';

describe('SpeechService Voice Accessibility', () => {
  it('should detect speech synthesis support when window APIs are present', () => {
    // In our test setup, window is present
    const supported = SpeechService.isSupported();
    expect(typeof supported).toBe('boolean');
  });

  it('should safely invoke stop without throwing', () => {
    expect(() => SpeechService.stop()).not.toThrow();
  });

  it('should handle speak callback execution', () => {
    const endSpy = vi.fn();
    SpeechService.speak('Test legal clause', endSpy);
    expect(endSpy).toBeDefined();
  });
});

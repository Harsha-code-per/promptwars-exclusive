/**
 * Web Speech API Accessibility Service
 * Provides audio synthesis for plain-English legal explanations,
 * supporting visually impaired users and non-native English speakers.
 */

export class SpeechService {
  private static currentUtterance: SpeechSynthesisUtterance | null = null;

  public static getCurrentUtterance(): SpeechSynthesisUtterance | null {
    return this.currentUtterance;
  }

  public static isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  }

  public static isSpeaking(): boolean {
    if (!this.isSupported()) return false;
    return window.speechSynthesis.speaking;
  }

  public static speak(text: string, onEnd?: () => void, onError?: () => void): void {
    if (!this.isSupported() || !text) {
      if (onEnd) onEnd();
      return;
    }

    // Stop any ongoing speech
    this.stop();

    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.lang = 'en-US';

      utterance.onend = () => {
        this.currentUtterance = null;
        if (onEnd) onEnd();
      };

      utterance.onerror = () => {
        this.currentUtterance = null;
        if (onError) onError();
      };

      this.currentUtterance = utterance;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Speech synthesis error:', err);
      if (onError) onError();
    }
  }

  public static stop(): void {
    if (!this.isSupported()) return;
    try {
      window.speechSynthesis.cancel();
      this.currentUtterance = null;
    } catch {
      // Ignored
    }
  }
}

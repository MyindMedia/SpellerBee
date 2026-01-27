// Global audio manager to prevent overlapping voices
class AudioManager {
  private currentAudio: HTMLAudioElement | null = null;

  play(url: string): Promise<void> {
    this.stop();

    const audio = new Audio(url);
    this.currentAudio = audio;

    return new Promise((resolve, reject) => {
      audio.onended = () => {
        if (this.currentAudio === audio) {
          this.currentAudio = null;
        }
        resolve();
      };
      
      audio.onerror = (e) => {
        if (this.currentAudio === audio) {
          this.currentAudio = null;
        }
        reject(e);
      };

      audio.play().catch((e) => {
        if (e.name !== "AbortError") reject(e);
      });
    });
  }

  stop() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    // Also cancel browser synthesis if any
    if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }
  }
}

export const audioManager = new AudioManager();
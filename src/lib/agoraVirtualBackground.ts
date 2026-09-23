import AgoraRTC, { ICameraVideoTrack } from 'agora-rtc-sdk-ng';
import VirtualBackgroundExtension, { IVirtualBackgroundProcessor } from 'agora-extension-virtual-background';

export type VirtualBackgroundMode = 'saremi' | 'none' | 'custom';

export interface VirtualBackgroundState {
  isEnabled: boolean;
  mode: VirtualBackgroundMode;
  isSupported: boolean;
  isLoading: boolean;
  customImageUrl?: string;
  error?: string | null;
}

const DEFAULT_BG_URL = '/saremi-virtual-background.png';

class AgoraVirtualBackgroundService {
  private extension: VirtualBackgroundExtension | null = null;
  private processor: IVirtualBackgroundProcessor | null = null;
  private isExtensionRegistered = false;
  private preloadedDefaultImg: HTMLImageElement | null = null;
  private preloadedCustomImg: HTMLImageElement | null = null;
  private currentTrack: ICameraVideoTrack | null = null;
  private currentMode: VirtualBackgroundMode = 'saremi';
  private isEnabled: boolean = true;
  private isInitialized = false;

  constructor() {
    // Preload the branded background image as early as possible
    if (typeof window !== 'undefined') {
      this.preloadDefaultImage();
    }
  }

  public preloadDefaultImage(): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      if (this.preloadedDefaultImg && this.preloadedDefaultImg.complete) {
        return resolve(this.preloadedDefaultImg);
      }
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        this.preloadedDefaultImg = img;
        resolve(img);
      };
      img.onerror = (err) => {
        console.warn('[VirtualBackground] Failed to preload default PNG, trying fallback SVG:', err);
        // Fallback to SVG asset
        const fallbackImg = new Image();
        fallbackImg.crossOrigin = 'anonymous';
        fallbackImg.onload = () => {
          this.preloadedDefaultImg = fallbackImg;
          resolve(fallbackImg);
        };
        fallbackImg.onerror = () => {
          console.error('[VirtualBackground] Could not load background image');
          reject(new Error('Failed to load virtual background asset'));
        };
        fallbackImg.src = '/saremi-virtual-bg.svg';
      };
      img.src = DEFAULT_BG_URL;
    });
  }

  public checkCompatibility(): boolean {
    try {
      if (typeof window === 'undefined') return false;
      if (!this.extension) {
        this.extension = new VirtualBackgroundExtension();
      }
      return this.extension.checkCompatibility();
    } catch (e) {
      console.warn('[VirtualBackground] Compatibility check failed:', e);
      return false;
    }
  }

  private registerExtensionOnce() {
    if (!this.isExtensionRegistered) {
      if (!this.extension) {
        this.extension = new VirtualBackgroundExtension();
      }
      try {
        AgoraRTC.registerExtensions([this.extension]);
        this.isExtensionRegistered = true;
      } catch (e: any) {
        console.warn('[VirtualBackground] Extension register warning:', e?.message || e);
        this.isExtensionRegistered = true; // Mark as attempted to avoid re-registering
      }
    }
  }

  /**
   * Initializes the processor and attaches it to the teacher's video track.
   */
  public async setupTrack(
    videoTrack: ICameraVideoTrack,
    initialMode: VirtualBackgroundMode = 'saremi',
    initialEnabled: boolean = true
  ): Promise<boolean> {
    this.currentTrack = videoTrack;
    this.currentMode = initialMode;
    this.isEnabled = initialEnabled;

    if (!this.checkCompatibility()) {
      console.warn('[VirtualBackground] Browser does not support Agora Virtual Background extension.');
      return false;
    }

    try {
      this.registerExtensionOnce();

      if (!this.processor && this.extension) {
        this.processor = this.extension.createProcessor();
        
        // Handle potential processing overload gracefully
        this.processor.onoverload = () => {
          console.warn('[VirtualBackground] Overload detected: lowering processing intensity or notifying');
        };

        // Initialize wasm/webgl pipeline
        await this.processor.init();
      }

      // Pipe videoTrack into processor and processor destination
      if (this.processor) {
        try {
          videoTrack.pipe(this.processor).pipe(videoTrack.processorDestination);
        } catch (pipeErr: any) {
          // If already piped, continue
          if (!pipeErr?.message?.includes('already piped')) {
            console.warn('[VirtualBackground] Track pipe notice:', pipeErr);
          }
        }
      }

      this.isInitialized = true;

      // Apply initial background state
      if (this.isEnabled && this.currentMode !== 'none') {
        await this.applyBackground(this.currentMode);
      } else {
        await this.disable();
      }

      return true;
    } catch (err: any) {
      console.error('[VirtualBackground] Setup failed:', err);
      // Ensure the raw video track continues to function without interruption
      return false;
    }
  }

  /**
   * Applies a specific background mode: 'saremi', 'none', or 'custom'
   */
  public async applyBackground(mode: VirtualBackgroundMode, customUrl?: string): Promise<boolean> {
    this.currentMode = mode;
    this.isEnabled = mode !== 'none';

    if (!this.processor) {
      return false;
    }

    try {
      if (mode === 'none') {
        await this.processor.disable();
        return true;
      }

      let sourceImg: HTMLImageElement | null = null;

      if (mode === 'custom' && customUrl) {
        sourceImg = await this.loadCustomImage(customUrl);
      } else {
        sourceImg = await this.preloadDefaultImage();
      }

      if (!sourceImg) {
        console.warn('[VirtualBackground] No image source available for virtual background');
        return false;
      }

      // Agora VirtualBackgroundEffectOptions
      // fit: 'cover' ensures the background fills the 16:9 canvas naturally
      this.processor.setOptions({
        type: 'img',
        source: sourceImg,
        fit: 'cover'
      });

      await this.processor.enable();
      return true;
    } catch (err: any) {
      console.error('[VirtualBackground] Failed to apply background:', err);
      return false;
    }
  }

  public async disable(): Promise<void> {
    this.isEnabled = false;
    if (this.processor) {
      try {
        await this.processor.disable();
      } catch (err) {
        console.warn('[VirtualBackground] Disable notice:', err);
      }
    }
  }

  public async enable(): Promise<void> {
    this.isEnabled = true;
    if (this.processor) {
      await this.applyBackground(this.currentMode);
    }
  }

  public setCustomImage(url: string): Promise<boolean> {
    return this.applyBackground('custom', url);
  }

  private loadCustomImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        this.preloadedCustomImg = img;
        resolve(img);
      };
      img.onerror = (e) => reject(e);
      img.src = url;
    });
  }

  /**
   * Releases resources when leaving or unmounting
   */
  public async cleanup(): Promise<void> {
    try {
      if (this.processor) {
        await this.processor.disable();
      }
      if (this.currentTrack) {
        try {
          this.currentTrack.unpipe();
        } catch (_) {}
      }
      this.currentTrack = null;
    } catch (e) {
      console.warn('[VirtualBackground] Cleanup notice:', e);
    }
  }
}

export const virtualBackgroundService = new AgoraVirtualBackgroundService();

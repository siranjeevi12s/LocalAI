export {};

declare global {
  interface Window {
    localMind?: {
      apiBaseUrl: string;
      platform: NodeJS.Platform;
    };
  }
}

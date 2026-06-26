export interface OllamaModel {
  name: string;
  displayName: string;
  size?: number;
  modifiedAt?: string;
  digest?: string;
  details?: {
    family?: string;
    format?: string;
    parameterSize?: string;
    quantizationLevel?: string;
  };
}

export interface HealthStatus {
  ok: boolean;
  app: {
    name: string;
    version: string;
  };
  ollama: {
    running: boolean;
    modelCount: number;
    version?: string;
  };
  message?: string;
}

export interface VersionInfo {
  app: {
    name: string;
    version: string;
  };
  ollama?: {
    version?: string;
  };
}

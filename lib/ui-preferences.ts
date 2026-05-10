export const INTERFACE_DENSITY_STORAGE_KEY = "synapse.interface_density";
export const READING_SIZE_STORAGE_KEY = "synapse.reading_size";

export const DEFAULT_INTERFACE_DENSITY = "comfortable" as const;
export const DEFAULT_READING_SIZE = "medium" as const;

export const INTERFACE_DENSITY_VALUES = ["compact", "comfortable"] as const;
export const READING_SIZE_VALUES = ["small", "medium", "large"] as const;

export type InterfaceDensity = (typeof INTERFACE_DENSITY_VALUES)[number];
export type ReadingSize = (typeof READING_SIZE_VALUES)[number];

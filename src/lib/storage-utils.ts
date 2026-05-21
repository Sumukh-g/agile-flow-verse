/**
 * Safe localStorage utilities with quota error handling
 * Prevents QuotaExceededError by clearing old data when needed
 */

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER: 'user',
  TENANT_ID: 'tenantId',
} as const;

/**
 * Get the size of localStorage in bytes (approximate)
 */
function getStorageSize(): number {
  let total = 0;
  for (const key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      const value = localStorage.getItem(key);
      if (value) {
        total += key.length + value.length;
      }
    }
  }
  return total;
}

/**
 * Clear non-essential localStorage data to free up space
 * Keeps only auth-related data
 */
function clearNonEssentialStorage(): void {
  const essentialKeys = new Set([
    STORAGE_KEYS.ACCESS_TOKEN,
    STORAGE_KEYS.REFRESH_TOKEN,
    STORAGE_KEYS.USER,
    STORAGE_KEYS.TENANT_ID,
  ]);

  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && !essentialKeys.has(key)) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn(`Failed to remove localStorage key: ${key}`, e);
    }
  });
}

/**
 * Safely set an item in localStorage with quota error handling
 * @param key - Storage key
 * @param value - Value to store
 * @param maxRetries - Maximum retry attempts after clearing storage
 * @returns true if successful, false if failed
 */
export function safeSetItem(
  key: string,
  value: string,
  maxRetries: number = 2
): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error: any) {
    // Check if it's a quota error
    if (
      error.name === 'QuotaExceededError' ||
      error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      error.code === 22 ||
      error.code === 1014
    ) {
      console.warn(`localStorage quota exceeded. Attempting to free space...`);

      if (maxRetries > 0) {
        // Clear non-essential data
        clearNonEssentialStorage();

        // Try again
        try {
          localStorage.setItem(key, value);
          console.log(`Successfully stored ${key} after clearing storage`);
          return true;
        } catch (retryError: any) {
          // If still failing, try removing the specific key first
          if (retryError.name === 'QuotaExceededError' && maxRetries > 1) {
            try {
              localStorage.removeItem(key);
              localStorage.setItem(key, value);
              console.log(`Successfully stored ${key} after removing old value`);
              return true;
            } catch (finalError) {
              console.error(
                `Failed to store ${key} even after clearing storage:`,
                finalError
              );
              return false;
            }
          }
        }
      }

      console.error(
        `Failed to store ${key}: localStorage quota exceeded and could not free enough space`
      );
      return false;
    }

    // Other errors (e.g., disabled localStorage)
    console.error(`Failed to store ${key}:`, error);
    return false;
  }
}

/**
 * Safely get an item from localStorage
 */
export function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error(`Failed to get ${key} from localStorage:`, error);
    return null;
  }
}

/**
 * Safely remove an item from localStorage
 */
export function safeRemoveItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Failed to remove ${key} from localStorage:`, error);
  }
}

/**
 * Clear all auth-related storage
 */
export function clearAuthStorage(): void {
  safeRemoveItem(STORAGE_KEYS.ACCESS_TOKEN);
  safeRemoveItem(STORAGE_KEYS.REFRESH_TOKEN);
  safeRemoveItem(STORAGE_KEYS.USER);
  safeRemoveItem(STORAGE_KEYS.TENANT_ID);
}

/**
 * Get storage usage info (for debugging)
 */
export function getStorageInfo(): {
  size: number;
  sizeKB: number;
  sizeMB: number;
  itemCount: number;
} {
  const size = getStorageSize();
  return {
    size,
    sizeKB: Math.round((size / 1024) * 100) / 100,
    sizeMB: Math.round((size / (1024 * 1024)) * 100) / 100,
    itemCount: localStorage.length,
  };
}


/**
 * Device ID Generation and Management
 * Provides unique device identification for profile ownership
 */

const DEVICE_ID_KEY = 'mtg_device_id';
const DEVICE_FINGERPRINT_KEY = 'mtg_device_fingerprint';

/**
 * Generates a unique device ID for this browser/device
 * @returns {string} Unique device identifier
 */
export function getDeviceId() {
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);

    if (!deviceId) {
        // Generate a unique device ID
        deviceId = `device_${generateRandomId()}`;
        localStorage.setItem(DEVICE_ID_KEY, deviceId);

        // Also store the fingerprint for validation
        const fingerprint = generateDeviceFingerprint();
        localStorage.setItem(DEVICE_FINGERPRINT_KEY, fingerprint);

        console.log('🔐 Generated new device ID:', deviceId);
    }

    return deviceId;
}

/**
 * Generates a random ID string
 * @returns {string} Random identifier
 */
function generateRandomId() {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 15);
    return `${timestamp}_${randomPart}`;
}

/**
 * Creates a device fingerprint for enhanced identification
 * @returns {string} Base64 encoded device fingerprint
 */
export function generateDeviceFingerprint() {
    const fingerprint = {
        userAgent: navigator.userAgent,
        screenResolution: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language,
        platform: navigator.platform,
        cookieEnabled: navigator.cookieEnabled,
        doNotTrack: navigator.doNotTrack,
        hardwareConcurrency: navigator.hardwareConcurrency || 0,
        colorDepth: screen.colorDepth,
        pixelDepth: screen.pixelDepth
    };

    try {
        return btoa(JSON.stringify(fingerprint));
    } catch (error) {
        console.warn('Could not generate device fingerprint:', error);
        return 'fallback_fingerprint';
    }
}

/**
 * Validates that the current environment matches the stored fingerprint
 * @returns {boolean} True if fingerprint matches
 */
export function validateDeviceFingerprint() {
    const storedFingerprint = localStorage.getItem(DEVICE_FINGERPRINT_KEY);
    if (!storedFingerprint) {
        return true; // No stored fingerprint, assume valid
    }

    const currentFingerprint = generateDeviceFingerprint();
    return storedFingerprint === currentFingerprint;
}

/**
 * Resets the device ID (useful for testing or if corruption occurs)
 */
export function resetDeviceId() {
    localStorage.removeItem(DEVICE_ID_KEY);
    localStorage.removeItem(DEVICE_FINGERPRINT_KEY);
    console.log('🔄 Device ID reset');
}

/**
 * Gets device information for debugging
 * @returns {Object} Device information
 */
export function getDeviceInfo() {
    return {
        deviceId: getDeviceId(),
        fingerprint: generateDeviceFingerprint(),
        isValidated: validateDeviceFingerprint(),
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language
    };
}

/**
 * Checks if this is the first time the device is being used
 * @returns {boolean} True if this is a new device
 */
export function isNewDevice() {
    return !localStorage.getItem(DEVICE_ID_KEY);
}

/**
 * Stores device metadata for analytics and debugging
 * @param {Object} metadata Additional metadata to store
 */
export function storeDeviceMetadata(metadata = {}) {
    const deviceData = {
        ...getDeviceInfo(),
        ...metadata,
        createdAt: new Date().toISOString(),
        lastSeen: new Date().toISOString()
    };

    localStorage.setItem('mtg_device_metadata', JSON.stringify(deviceData));
}

/**
 * Updates the last seen timestamp for this device
 */
export function updateLastSeen() {
    const metadata = getStoredDeviceMetadata();
    if (metadata) {
        metadata.lastSeen = new Date().toISOString();
        localStorage.setItem('mtg_device_metadata', JSON.stringify(metadata));
    }
}

/**
 * Gets stored device metadata
 * @returns {Object|null} Stored device metadata
 */
export function getStoredDeviceMetadata() {
    try {
        const data = localStorage.getItem('mtg_device_metadata');
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.warn('Could not parse device metadata:', error);
        return null;
    }
}

// Auto-update last seen on import
updateLastSeen();
import * as LocalAuthentication from 'expo-local-authentication';

/**
 * Authenticate with device biometrics.
 * Returns { ok, available } — when no hardware/enrollment exists we degrade
 * gracefully (offline-first app must never hard-lock the user out).
 */
export async function authenticate(promptMessage: string): Promise<{ ok: boolean; available: boolean }> {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const enrolled = hasHardware && (await LocalAuthentication.isEnrolledAsync());
    if (!hasHardware || !enrolled) {
      return { ok: true, available: false };
    }
    const res = await LocalAuthentication.authenticateAsync({
      promptMessage,
      cancelLabel: 'Batal',
    });
    return { ok: res.success, available: true };
  } catch {
    return { ok: true, available: false };
  }
}

export async function biometricAvailable(): Promise<boolean> {
  try {
    return (await LocalAuthentication.hasHardwareAsync()) && (await LocalAuthentication.isEnrolledAsync());
  } catch {
    return false;
  }
}

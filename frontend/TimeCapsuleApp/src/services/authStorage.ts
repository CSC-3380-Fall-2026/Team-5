
import * as Keychain from 'react-native-keychain';

const TOKEN_SERVICE = 'timecapsule.auth';

export async function saveAuthToken(token: string): Promise<void> {
  await Keychain.setGenericPassword('authToken', token, {
    service: TOKEN_SERVICE,
  });
}

export async function getAuthToken(): Promise<string | null> {
  const credentials = await Keychain.getGenericPassword({
    service: TOKEN_SERVICE,
  });

  return credentials ? credentials.password : null;
}

export async function clearAuthToken(): Promise<void> {
  await Keychain.resetGenericPassword({
    service: TOKEN_SERVICE,
  });
}

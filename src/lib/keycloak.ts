import Keycloak from 'keycloak-js';

const keycloakConfig = {
  url: 'http://localhost:8080',
  realm: 'app',
  clientId: 'frontend',
};

export const keycloak = new Keycloak(keycloakConfig);

export const initKeycloak = async () => {
  try {
    const authenticated = await keycloak.init({
      onLoad: 'check-sso',
      silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
      pkceMethod: 'S256',
      checkLoginIframe: false,
    });
    return authenticated;
  } catch (error) {
    console.error('Keycloak initialization failed:', error);
    // Return false to indicate Keycloak is not available
    return false;
  }
};

export const getToken = async (): Promise<string | null> => {
  try {
    // Only try to get token if Keycloak is authenticated
    if (keycloak.authenticated) {
      await keycloak.updateToken(30);
      return keycloak.token || null;
    }
    return null;
  } catch (error) {
    console.error('Failed to refresh token:', error);
    // Don't logout here, just return null
    return null;
  }
}; 
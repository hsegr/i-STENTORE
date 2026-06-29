import type { AuthProviderProps } from "react-oidc-context";
import { User } from "oidc-client-ts";

const keycloakUrl = import.meta.env.VITE_KEYCLOAK_URL || "https://iam.hse.gr";
const keycloakRealm = import.meta.env.VITE_KEYCLOAK_REALM || "WeForming";
const keycloakClientId = import.meta.env.VITE_KEYCLOAK_CLIENT_ID || "OnboardingTest";

export const oidcConfig: AuthProviderProps = {
  authority: `${keycloakUrl}/realms/${keycloakRealm}`,
  client_id: keycloakClientId,
  redirect_uri: window.location.origin,
  post_logout_redirect_uri: window.location.origin,
  onSigninCallback: (_user: User | void): void => {
    window.history.replaceState({}, document.title, window.location.pathname);
  },
};

export const KEYCLOAK_ROLES = {
  ADMIN: "admin",
  USER: "user",
} as const;

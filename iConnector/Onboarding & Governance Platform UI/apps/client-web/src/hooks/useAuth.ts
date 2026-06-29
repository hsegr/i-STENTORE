import { useAuth as useOidcAuth } from "react-oidc-context";
import { KEYCLOAK_ROLES } from "@/features/auth/config/oidc.config.ts";

interface KeycloakTokenPayload {
  realm_access?: {
    roles?: string[];
  };
  resource_access?: Record<
    string,
    {
      roles?: string[];
    }
  >;
}

function decodeJwtPayload(token: string | undefined): KeycloakTokenPayload | undefined {
  if (!token) {
    return undefined;
  }

  const parts = token.split(".");
  if (parts.length < 2) {
    return undefined;
  }

  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const json = atob(padded);
    return JSON.parse(json) as KeycloakTokenPayload;
  } catch {
    return undefined;
  }
}

function collectRoles(payload: KeycloakTokenPayload | undefined): string[] {
  if (!payload) {
    return [];
  }

  const realmRoles = payload.realm_access?.roles ?? [];
  const resourceRoles = Object.values(payload.resource_access ?? {}).flatMap((resource) => resource.roles ?? []);

  return [...realmRoles, ...resourceRoles];
}

export function useAuth() {
  const auth = useOidcAuth();

  if (import.meta.env.VITE_E2E_AUTH === "true") {
    const role = globalThis.localStorage?.getItem("e2e.auth.role") === KEYCLOAK_ROLES.ADMIN
      ? KEYCLOAK_ROLES.ADMIN
      : KEYCLOAK_ROLES.USER;
    const isAdmin = role === KEYCLOAK_ROLES.ADMIN;
    const profile = {
      email: isAdmin ? "admin@example.test" : "participant@example.test",
      name: isAdmin ? "Admin Test User" : "Participant Test User",
      preferred_username: isAdmin ? "admin-test-user" : "participant-test-user",
      realm_access: {
        roles: [role],
      },
    };

    return {
      ...auth,
      user: {
        profile,
        access_token: "",
        id_token: "",
      } as unknown as typeof auth.user,
      roles: [role],
      isAdmin,
      isUser: !isAdmin,
      isAuthenticated: true,
      isLoading: false,
      login: () => Promise.resolve(),
      logout: () => Promise.resolve(),
    };
  }

  const profilePayload = auth.user?.profile as KeycloakTokenPayload | undefined;
  const accessTokenPayload = decodeJwtPayload(auth.user?.access_token);
  const idTokenPayload = decodeJwtPayload(auth.user?.id_token);

  const normalizedRoles = new Set(
    [...collectRoles(profilePayload), ...collectRoles(accessTokenPayload), ...collectRoles(idTokenPayload)].map(
      (role) => role.toLowerCase(),
    ),
  );
  const roles = Array.from(normalizedRoles);

  const isAdmin = normalizedRoles.has(KEYCLOAK_ROLES.ADMIN);
  const isUser = normalizedRoles.has(KEYCLOAK_ROLES.USER) || !isAdmin;

  return {
    ...auth,
    roles,
    isAdmin,
    isUser,
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    login: () => auth.signinRedirect(),
    logout: () => auth.signoutRedirect(),
  };
}

export interface KeycloakUser {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  enabled: boolean;
  emailVerified: boolean;
}

export interface KeycloakRole {
  id: string;
  name: string;
  description?: string;
}

export interface AdminApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

export interface UserWithRoles extends KeycloakUser {
  roles: string[];
}

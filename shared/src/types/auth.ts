export type AuthErrorCode =
  | 'TOO_MANY_REQUESTS'
  | 'PASSWORD_CHANGE_REQUIRED'
  | 'SESSION_REVOKED'
  | 'UNAUTHORIZED'
  | 'VALIDATION_ERROR'
  | 'NETWORK_ERROR';

export interface AuthTenantProfile {
  id: string;
  name: string;
  email: string | null;
  must_change_password: boolean;
  whatsapp_instance_name: string | null;
  whatsapp_connected: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  tenant: AuthTenantProfile;
}

export interface ChangePasswordRequest {
  current_password?: string;
  currentPassword?: string;
  new_password?: string;
  newPassword?: string;
}

export interface ChangePasswordResponse {
  token: string;
  message: string;
}

export interface MeResponse {
  tenant: AuthTenantProfile;
}

export type SettingType = 'general' | 'theme' | 'email' | 'security' | 'api';

export type UserRole = 'admin' | 'user' | 'viewer' | 'manager';

export interface SiteSetting {
  id: string;
  setting_key: string;
  setting_value: any;
  setting_type: SettingType;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRoleData {
  id: string;
  user_id: string;
  role: UserRole;
  permissions: Record<string, boolean>;
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, any> | null;
  ip_address: string | null;
  created_at: string;
}

export interface UserWithRole {
  id: string;
  email: string;
  full_name: string | null;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface ThemeSettings {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  success_color: string;
  warning_color: string;
  error_color: string;
  font_family: string;
}

export interface GeneralSettings {
  site_name: string;
  site_description: string;
  site_logo: string;
  contact_email: string;
  max_upload_size: number;
  allowed_file_types: string[];
  invoice_categories: string[];
  currency: string;
  date_format: string;
  timezone: string;
}

export interface SecuritySettings {
  enable_registration: boolean;
  require_email_verification: boolean;
}


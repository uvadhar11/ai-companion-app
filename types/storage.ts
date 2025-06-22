export interface Contact {
  id: string;
  name: string;
  phoneNumber: string;
}

export interface CompanionCustomization {
  id: string;
  safeWord: string;
  emergencyContact: string;
  personalContext: string;
}

export interface UserProfile {
  name: string;
  phone: string;
  emergencyContacts: Contact[];
}

export interface AppData {
  userProfile: UserProfile;
  companionCustomizations: Record<string, CompanionCustomization>;
  // Add more data types here as needed
  settings?: {
    notifications: boolean;
    darkMode: boolean;
    // Add more settings as needed
  };
}

export const DEFAULT_APP_DATA: AppData = {
  userProfile: {
    name: '',
    phone: '',
    emergencyContacts: [],
  },
  companionCustomizations: {},
  settings: {
    notifications: true,
    darkMode: false,
  },
};
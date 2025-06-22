import { useState, useEffect, useCallback } from 'react';
import StorageService from '@/services/StorageService';
import { AppData, UserProfile, CompanionCustomization, Contact } from '@/types/storage';

// Main hook for accessing all app data
export function useAppData() {
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const appData = await StorageService.getData();
      setData(appData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const updateData = useCallback(async (updates: Partial<AppData>) => {
    try {
      const updatedData = await StorageService.updateData(updates);
      setData(updatedData);
      return updatedData;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update data');
      throw err;
    }
  }, []);

  return {
    data,
    loading,
    error,
    updateData,
    reload: loadData,
  };
}

// Hook specifically for user profile data
export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const userProfile = await StorageService.getUserProfile();
      setProfile(userProfile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    try {
      const updatedProfile = await StorageService.updateUserProfile(updates);
      setProfile(updatedProfile);
      return updatedProfile;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
      throw err;
    }
  }, []);

  const addEmergencyContact = useCallback(async (contact: Contact) => {
    try {
      const updatedContacts = await StorageService.addEmergencyContact(contact);
      setProfile(prev => prev ? { ...prev, emergencyContacts: updatedContacts } : null);
      return updatedContacts;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add contact');
      throw err;
    }
  }, []);

  const removeEmergencyContact = useCallback(async (contactId: string) => {
    try {
      const updatedContacts = await StorageService.removeEmergencyContact(contactId);
      setProfile(prev => prev ? { ...prev, emergencyContacts: updatedContacts } : null);
      return updatedContacts;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove contact');
      throw err;
    }
  }, []);

  return {
    profile,
    loading,
    error,
    updateProfile,
    addEmergencyContact,
    removeEmergencyContact,
    reload: loadProfile,
  };
}

// Hook for companion customizations
export function useCompanionCustomization(companionId: string) {
  const [customization, setCustomization] = useState<CompanionCustomization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCustomization = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const companionCustomization = await StorageService.getCompanionCustomization(companionId);
      setCustomization(companionCustomization);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load customization');
    } finally {
      setLoading(false);
    }
  }, [companionId]);

  useEffect(() => {
    loadCustomization();
  }, [loadCustomization]);

  const updateCustomization = useCallback(async (updates: Partial<CompanionCustomization>) => {
    try {
      const updatedCustomization = await StorageService.updateCompanionCustomization(companionId, updates);
      setCustomization(updatedCustomization);
      return updatedCustomization;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update customization');
      throw err;
    }
  }, [companionId]);

  return {
    customization,
    loading,
    error,
    updateCustomization,
    reload: loadCustomization,
  };
}

// Hook for app settings
export function useSettings() {
  const [settings, setSettings] = useState<AppData['settings'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const appSettings = await StorageService.getSettings();
      setSettings(appSettings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const updateSettings = useCallback(async (updates: Partial<NonNullable<AppData['settings']>>) => {
    try {
      const updatedSettings = await StorageService.updateSettings(updates);
      setSettings(updatedSettings);
      return updatedSettings;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update settings');
      throw err;
    }
  }, []);

  return {
    settings,
    loading,
    error,
    updateSettings,
    reload: loadSettings,
  };
}
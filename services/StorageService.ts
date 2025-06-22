import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppData, DEFAULT_APP_DATA, UserProfile, CompanionCustomization, Contact } from '@/types/storage';

class StorageService {
  private static readonly STORAGE_KEY = '@CompanionAI:AppData';
  private static instance: StorageService;
  private cache: AppData | null = null;

  private constructor() {}

  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  // Initialize and load data from storage
  async initialize(): Promise<AppData> {
    try {
      const storedData = await AsyncStorage.getItem(StorageService.STORAGE_KEY);
      if (storedData) {
        this.cache = { ...DEFAULT_APP_DATA, ...JSON.parse(storedData) };
      } else {
        this.cache = { ...DEFAULT_APP_DATA };
        await this.saveData(this.cache);
      }
      return this.cache;
    } catch (error) {
      console.error('Error initializing storage:', error);
      this.cache = { ...DEFAULT_APP_DATA };
      return this.cache;
    }
  }

  // Get current data (from cache if available, otherwise load from storage)
  async getData(): Promise<AppData> {
    if (this.cache) {
      return this.cache;
    }
    return await this.initialize();
  }

  // Save data to storage and update cache
  private async saveData(data: AppData): Promise<void> {
    try {
      await AsyncStorage.setItem(StorageService.STORAGE_KEY, JSON.stringify(data));
      this.cache = data;
    } catch (error) {
      console.error('Error saving data:', error);
      throw error;
    }
  }

  // Update specific parts of the data
  async updateData(updates: Partial<AppData>): Promise<AppData> {
    const currentData = await this.getData();
    const newData = { ...currentData, ...updates };
    await this.saveData(newData);
    return newData;
  }

  // User Profile Methods
  async getUserProfile(): Promise<UserProfile> {
    const data = await this.getData();
    return data.userProfile;
  }

  async updateUserProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
    const data = await this.getData();
    const updatedProfile = { ...data.userProfile, ...profile };
    await this.updateData({ userProfile: updatedProfile });
    return updatedProfile;
  }

  async addEmergencyContact(contact: Contact): Promise<Contact[]> {
    const data = await this.getData();
    const updatedContacts = [...data.userProfile.emergencyContacts, contact];
    await this.updateUserProfile({ emergencyContacts: updatedContacts });
    return updatedContacts;
  }

  async removeEmergencyContact(contactId: string): Promise<Contact[]> {
    const data = await this.getData();
    const updatedContacts = data.userProfile.emergencyContacts.filter(
      contact => contact.id !== contactId
    );
    await this.updateUserProfile({ emergencyContacts: updatedContacts });
    return updatedContacts;
  }

  // Companion Customization Methods
  async getCompanionCustomization(companionId: string): Promise<CompanionCustomization | null> {
    const data = await this.getData();
    return data.companionCustomizations[companionId] || null;
  }

  async updateCompanionCustomization(
    companionId: string, 
    customization: Partial<CompanionCustomization>
  ): Promise<CompanionCustomization> {
    const data = await this.getData();
    const currentCustomization = data.companionCustomizations[companionId] || {
      id: companionId,
      safeWord: 'Do you want to order pizza?',
      emergencyContact: '',
      personalContext: '',
    };
    
    const updatedCustomization = { ...currentCustomization, ...customization };
    const updatedCustomizations = {
      ...data.companionCustomizations,
      [companionId]: updatedCustomization,
    };
    
    await this.updateData({ companionCustomizations: updatedCustomizations });
    return updatedCustomization;
  }

  // Settings Methods
  async getSettings(): Promise<AppData['settings']> {
    const data = await this.getData();
    return data.settings || DEFAULT_APP_DATA.settings;
  }

  async updateSettings(settings: Partial<NonNullable<AppData['settings']>>): Promise<AppData['settings']> {
    const data = await this.getData();
    const updatedSettings = { ...data.settings, ...settings };
    await this.updateData({ settings: updatedSettings });
    return updatedSettings;
  }

  // Utility Methods
  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(StorageService.STORAGE_KEY);
      this.cache = { ...DEFAULT_APP_DATA };
    } catch (error) {
      console.error('Error clearing data:', error);
      throw error;
    }
  }

  async exportData(): Promise<string> {
    const data = await this.getData();
    return JSON.stringify(data, null, 2);
  }

  async importData(jsonData: string): Promise<AppData> {
    try {
      const importedData = JSON.parse(jsonData);
      const mergedData = { ...DEFAULT_APP_DATA, ...importedData };
      await this.saveData(mergedData);
      return mergedData;
    } catch (error) {
      console.error('Error importing data:', error);
      throw new Error('Invalid data format');
    }
  }
}

export default StorageService.getInstance();
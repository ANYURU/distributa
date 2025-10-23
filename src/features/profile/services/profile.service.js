import { BaseService } from "../../../lib/appwrite/base-service";
import { appwriteConfig } from "../../../lib/appwrite/config";
import { account } from "../../../lib/appwrite/client";
import { Permission, Role, ID } from "appwrite";

class ProfileService extends BaseService {
  constructor() {
    super(appwriteConfig.collections.profiles, ["name", "email"]);
  }

  async getProfile(userId) {
    try {
      return await this.getDocument(userId);
    } catch (error) {
      console.error("Error getting profile:", error);
      throw error;
    }
  }

  async updateProfile(userId, profileData) {
    try {
      return await this.updateDocument(userId, profileData);
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  }

  async uploadAvatar(userId, avatarFile) {
    try {
      const permissions = [
        Permission.read(Role.any()),
        Permission.update(Role.user(userId)),
        Permission.delete(Role.user(userId)),
      ];

      const profile = await this.getProfile(userId);
      if (profile?.avatar_ref) {
        await this.deleteAvatar(userId);
      }

      const file = await this.storage.createFile(
        appwriteConfig.buckets.avatars,
        ID.unique(),
        avatarFile,
        permissions
      );

      const url = this.storage.getFileView(
        appwriteConfig.buckets.avatars,
        file.$id
      );

      // Update profile with new avatar
      await this.updateProfile(userId, {
        avatar_url: url,
        avatar_ref: file.$id
      });

      return { url, fileId: file.$id };
    } catch (error) {
      console.error("Error uploading avatar:", error);
      throw error;
    }
  }

  async deleteAvatar(userId) {
    try {
      const profile = await this.getProfile(userId);
      
      if (profile?.avatar_ref) {
        await this.storage.deleteFile(
          appwriteConfig.buckets.avatars,
          profile.avatar_ref
        );

        await this.updateProfile(userId, {
          avatar_url: null,
          avatar_ref: null
        });
      }
    } catch (error) {
      console.error("Error deleting avatar:", error);
      throw error;
    }
  }

  async updatePersonalDetails(userId, personalData, password = null) {
    try {
      const currentUser = await account.get();

      // Update email if changed
      if (currentUser.email !== personalData.email && password) {
        await account.updateEmail(personalData.email, password);
      }

      // Update name
      if (personalData.name) {
        await account.updateName(personalData.name);
      }

      // Update profile document
      return await this.updateProfile(userId, {
        name: personalData.name,
        email: personalData.email,
      });
    } catch (error) {
      console.error("Error updating personal details:", error);
      throw error;
    }
  }

  async changePassword(newPassword, currentPassword) {
    try {
      await account.updatePassword(newPassword, currentPassword);
      return { success: true, message: "Password updated successfully" };
    } catch (error) {
      console.error("Error changing password:", error);
      throw error;
    }
  }
}

export const profileService = new ProfileService();
export default ProfileService;
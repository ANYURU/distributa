import { account } from "../../../lib/appwrite/client";

import { profileService } from "../services/profile.service";
export async function profileLoader() {
  const { $id: userId } = await account.get();

  const profilePromise = profileService.getProfile(userId);
  return { profile: profilePromise };
}

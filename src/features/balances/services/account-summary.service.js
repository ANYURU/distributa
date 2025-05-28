import { Permission, Role, Query } from "appwrite";
import { BaseService } from "../../../lib/appwrite/base-service";
import { appwriteConfig } from "../../../lib/appwrite/config";

/**
 * CRUD service for account summaries
 */
class AccountSummaryService extends BaseService {
  constructor() {
    super(appwriteConfig.collections.accountSummaries, []);
  }

  /**
   * Get user account summary by user ID
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} Account summary or null if not found
   */
  async getByUserId(userId) {
    try {
      const result = await this.listDocuments({ page: 0, pageSize: 1 }, [
        Query.equal("user_id", userId),
      ]);

      return result.total > 0 ? result.documents[0] : null;
    } catch (error) {
      throw new Error(`Failed to get account summary: ${error.message}`);
    }
  }

  /**
   * Create new account summary
   * @param {string} userId - User ID
   * @param {Object} data - Account summary data
   * @returns {Promise<Object>} Created account summary
   */
  async create(userId, data = {}) {
    try {
      const defaultData = {
        user_id: userId,
        total_income: 0,
        total_expenses: 0,
        current_balance: 0,
        currency: "USD",
        budget_limit: 0,
        savings_goal: 0,
        last_transaction_date: new Date().toISOString(),
      };

      return await this.createDocument({ ...defaultData, ...data }, [
        Permission.read(Role.user(userId)),
        Permission.update(Role.user(userId)),
        Permission.delete(Role.user(userId)),
      ]);
    } catch (error) {
      throw new Error(`Failed to create account summary: ${error.message}`);
    }
  }

  /**
   * Update account summary
   * @param {string} documentId - Document ID
   * @param {Object} data - Data to update
   * @returns {Promise<Object>} Updated account summary
   */
  async update(documentId, data) {
    try {
      return await this.updateDocument(documentId, data);
    } catch (error) {
      throw new Error(`Failed to update account summary: ${error.message}`);
    }
  }
}

export const accountSummaryService = new AccountSummaryService();
export default accountSummaryService;

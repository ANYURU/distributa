import { Permission, Role, Query } from "appwrite";
import { BaseService } from "../../../lib/appwrite/base-service";
import { appwriteConfig } from "../../../lib/appwrite/config";

/**
 * CRUD service for monthly category totals
 */
class CategoryTotalService extends BaseService {
  constructor() {
    super(appwriteConfig.collections.monthlyCategoryTotals, []);
  }

  /**
   * Get category total by monthly statement ID and category ID
   * @param {string} monthlyStatementId - Monthly statement ID
   * @param {string} categoryId - Category ID
   * @returns {Promise<Object|null>} Category total or null if not found
   */
  async getByStatementAndCategory(monthlyStatementId, categoryId) {
    try {
      const result = await this.listDocuments({ page: 0, pageSize: 1 }, [
        Query.equal("monthly_statement_id", monthlyStatementId),
        Query.equal("category_id", categoryId),
      ]);

      return result.total > 0 ? result.documents[0] : null;
    } catch (error) {
      throw new Error(`Failed to get category total: ${error.message}`);
    }
  }

  /**
   * Create new category total
   * @param {string} userId - User ID
   * @param {string} monthlyStatementId - Monthly statement ID
   * @param {string} categoryId - Category ID
   * @param {number} amount - Amount
   * @returns {Promise<Object>} Created category total
   */
  async create(userId, monthlyStatementId, categoryId, amount) {
    try {
      return await this.createDocument(
        {
          monthly_statement_id: monthlyStatementId,
          category_id: categoryId,
          amount: amount,
        },
        [
          Permission.read(Role.user(userId)),
          Permission.update(Role.user(userId)),
          Permission.delete(Role.user(userId)),
        ]
      );
    } catch (error) {
      throw new Error(`Failed to create category total: ${error.message}`);
    }
  }

  /**
   * Update category total
   * @param {string} documentId - Document ID
   * @param {Object} data - Data to update
   * @returns {Promise<Object>} Updated category total
   */
  async update(documentId, data) {
    try {
      return await this.updateDocument(documentId, data);
    } catch (error) {
      throw new Error(`Failed to update category total: ${error.message}`);
    }
  }

  /**
   * Delete category total
   * @param {string} documentId - Document ID
   * @returns {Promise<Object>} Delete response
   */
  async delete(documentId) {
    try {
      return await this.deleteDocument(documentId);
    } catch (error) {
      throw new Error(`Failed to delete category total: ${error.message}`);
    }
  }

  /**
   * Get all category totals for a monthly statement
   * @param {string} monthlyStatementId - Monthly statement ID
   * @returns {Promise<Object>} Category totals
   */
  async getAllByStatement(monthlyStatementId) {
    try {
      return await this.listDocuments({ page: 0, pageSize: 100 }, [
        Query.equal("monthly_statement_id", monthlyStatementId),
      ]);
    } catch (error) {
      throw new Error(
        `Failed to get category totals by statement: ${error.message}`
      );
    }
  }
}

export const categoryTotalService = new CategoryTotalService();
export default categoryTotalService;

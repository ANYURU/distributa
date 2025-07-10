import { BaseService } from "../../../lib/appwrite/base-service";
import { appwriteConfig } from "../../../lib/appwrite/config";
import { account } from "../../../lib/appwrite/client";
import { Query, ID, Permission, Role } from "appwrite";
class TransactionService extends BaseService {
  constructor() {
    super(appwriteConfig.collections.transactions, [
      "description",
      "flow_type",
      "item",
    ]);
  }

  /**
   * @function createTransaction
   * @description Creates a new transaction document
   * @param {Object} transactionData The data for the new transaction
   * @returns {Promise} A promise that resolves to the created transaction document
   */
  async createTransaction(transactionData) {
    try {
      const currentUser = await account.get();

      const permissions = [
        Permission.read(Role.user(currentUser.$id)),
        Permission.update(Role.user(currentUser.$id)),
        Permission.delete(Role.user(currentUser.$id)),
      ];

      // Use the ID if provided, otherwise generate a new one
      const documentId = transactionData.$id || ID.unique();

      // If $id was in the payload, remove it as it's passed separately
      if (transactionData.$id) {
        const { $id, ...dataWithoutId } = transactionData;
        return this.createDocument(dataWithoutId, permissions, documentId);
      }

      return this.createDocument(transactionData, permissions, documentId);
    } catch (error) {
      console.error("Error creating transaction:", error);
      throw error;
    }
  }

  /**
   * @function getTransaction
   * @description Retrieves a specific transaction
   * @param {String} transactionId The ID of the transaction to retrieve
   * @returns {Promise} A promise that resolves to the transaction document
   */
  async getTransaction(transactionId) {
    return this.getDocument(transactionId);
  }

  /**
   * @function listTransactions
   * @description Lists all transactions with filters
   * @param {Object} options - Filter options
   * @param {number} [options.limit=25] - Number of records to return
   * @param {number} [options.offset=0] - Number of records to skip
   * @param {string} [options.flow_type] - Filter by flow type
   * @param {string} [options.category] - Filter by category
   * @param {string} [options.search] - Search term
   * @returns {Promise<{documents: Array, total: number}>} - List of transactions
   */
  async listTransactions(options = {}) {
    const serviceQueries = [];

    serviceQueries.push(Query.orderDesc("date"));

    if (options?.flow_type) {
      serviceQueries.push(Query.equal("flow_type", options.flow_type));
    }

    if (options?.status) {
      serviceQueries.push(Query.equal("status", options.status));
    }

    if (options?.category) {
      serviceQueries.push(Query.equal("category", options.category));
    }

    if (options?.contact) {
      serviceQueries.push(Query.equal("contact", options.contact));
    }

    if (options.amount) {
      const amount = parseFloat(options.amount);
      if (!isNaN(amount)) {
        serviceQueries.push(Query.equal("amount", amount));
      }
    }

    const dateFilters = {};
    if (options.dates?.from) {
      dateFilters.startDate = options.dates.from;
    }

    if (options.dates?.to) {
      dateFilters.endDate = options.dates.to;
    }

    return this.listDocuments({ ...options, ...dateFilters }, serviceQueries);
  }

  /**
   * @function updateTransaction
   * @description Updates an existing transaction
   * @param {String} transactionId The ID of the transaction to update
   * @param {Object} updateData The data to update in the transaction
   * @returns {Promise} A promise that resolves to the updated transaction document
   */
  async updateTransaction(transactionId, updateData) {
    try {
      return this.updateDocument(transactionId, updateData);
    } catch (error) {
      console.error("Error updating transaction:", error);
      throw error;
    }
  }

  /**
   * @function updateTransactionStatus
   * @description Updates the status of a transaction
   * @param {String} transactionId The ID of the transaction to update
   * @param {TransactionStatus} newStatus The new status of the transaction
   * @param {string[]} permissions The permissions for the transaction
   * @returns {Promise} A promise that resolves to the updated transaction document
   */
  async updateTransactionStatus(transactionId, newStatus, permissions = []) {
    try {
      const transaction = await this.getTransaction(transactionId);

      if (newStatus === transaction.status) {
        return transaction;
      }

      if (permissions.length > 0) {
        return this.updateDocument(
          transactionId,
          { status: newStatus },
          permissions
        );
      }

      return this.updateDocument(transactionId, { status: newStatus });
    } catch (error) {
      console.error("Error updating transaction status:", error);
      throw error;
    }
  }

  /**
   * @function deleteTransaction
   * @description Deletes a transaction
   * @param {String} transactionId The ID of the transaction to delete
   * @returns {Promise} A promise that resolves when the transaction is deleted
   */
  async deleteTransaction(transactionId) {
    return this.deleteDocument(transactionId);
  }

  /**
   * @function searchTransactions
   * @description Searches for transactions based on given criteria
   * @param {Object} searchCriteria The search criteria
   * @returns {Promise} A promise that resolves to the list of matching transaction documents
   */
  async searchTransactions(searchCriteria) {
    const queries = Object.entries(searchCriteria).map(([key, value]) =>
      Query.equal(key, value)
    );

    return this.listDocuments({}, queries);
  }

  /**
   * @function getTransactionsByType
   * @description Gets transactions filtered by flow_type (income/expense)
   * @param {String} flow_type The type of transactions to retrieve
   * @param {Object} options Optional parameters for querying
   * @returns {Promise} A promise that resolves to the filtered list of transactions
   */
  async getTransactionsByType(flow_type, options = {}) {
    const queries = [
      Query.equal("flow_type", flow_type),
      Query.orderDesc("$createdAt"),
    ];

    return this.listDocuments(options, queries);
  }

  /**
   * @function getTransactionsByDateRange
   * @description Gets transactions within a specified date range
   * @param {String} startDate Start date of the range
   * @param {String} endDate End date of the range
   * @param {Object} options Optional parameters for querying
   * @returns {Promise} A promise that resolves to the filtered list of transactions
   */
  async getTransactionsByDateRange(startDate, endDate, options = {}) {
    const queries = [
      Query.greaterThanEqual("date", startDate),
      Query.lessThanEqual("date", endDate),
      Query.orderDesc("date"),
    ];

    return this.listDocuments(options, queries);
  }

  /**
   * @function getTransactionsByCategory
   * @description Gets transactions filtered by category
   * @param {String} category The category to filter by
   * @param {Object} options Optional parameters for querying
   * @returns {Promise} A promise that resolves to the filtered list of transactions
   */
  async getTransactionsByCategory(category, options = {}) {
    const queries = [
      Query.equal("category", category),
      Query.orderDesc("$createdAt"),
    ];

    return this.listDocuments(options, queries);
  }
}

export const transactionService = new TransactionService();
export default TransactionService;

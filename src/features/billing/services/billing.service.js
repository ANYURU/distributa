import { BaseService } from "../../../lib/appwrite/base-service";
import { appwriteConfig } from "../../../lib/appwrite/config";
import { account } from "../../../lib/appwrite/client";
import { Permission, Role, Query } from "appwrite";

/**
 * Billing Address Service for managing billing addresses across the application
 */
class BillingAddressService extends BaseService {
  /**
   * Create a new BillingAddressService instance
   * @param {Object} config - Configuration options
   * @param {string} config.collectionId - Override default collection ID
   */
  constructor(config = {}) {
    const collectionId =
      config.collectionId || appwriteConfig.collections.billingAddresses;
    super(collectionId, ["name", "email", "address"]);
  }

  /**
   * Create a new billing address
   * @param {Object} billingAddressData - Billing address data
   * @param {string} billingAddressData.name - Name for billing
   * @param {string} billingAddressData.email - Email address
   * @param {string} billingAddressData.address - Physical address
   * @returns {Promise<Object>} - Created billing address
   */
  async createBillingAddress({ name, email, address }) {
    try {
      // Validate required fields
      if (!name || !email || !address) {
        throw new Error("Name, email, and address are required fields");
      }

      // Validate email format
      if (!this.#isValidEmail(email)) {
        throw new Error("Invalid email format");
      }

      const currentUser = await account.get();

      const billingAddress = await this.createDocument(
        {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          address: address.trim(),
        },
        [
          Permission.read(Role.user(currentUser.$id)),
          Permission.update(Role.user(currentUser.$id)),
          Permission.delete(Role.user(currentUser.$id)),
        ]
      );

      return billingAddress;
    } catch (error) {
      throw new Error(`Failed to create billing address: ${error.message}`);
    }
  }

  /**
   * Get billing address by ID
   * @param {string} billingAddressId - Billing address ID
   * @returns {Promise<Object>} - Billing address document
   */
  async getBillingAddress(billingAddressId) {
    try {
      if (!billingAddressId) {
        throw new Error("Billing address ID is required");
      }

      return await this.getDocument(billingAddressId);
    } catch (error) {
      throw new Error(`Failed to get billing address: ${error.message}`);
    }
  }

  /**
   * Get billing addresses by IDs
   * @param {string[]} billingAddressIds - Array of billing address IDs
   * @returns {Promise<Object>} - Billing addresses list
   */
  async getByIds(billingAddressIds) {
    try {
      if (!Array.isArray(billingAddressIds) || billingAddressIds.length === 0) {
        return { documents: [], total: 0 };
      }

      return await this.listDocuments(
        { page: 1, pageSize: billingAddressIds.length },
        [Query.equal("$id", billingAddressIds)]
      );
    } catch (error) {
      throw new Error(
        `Failed to get billing addresses by IDs: ${error.message}`
      );
    }
  }

  /**
   * List billing addresses with optional filters
   * @param {Object} filters - Optional filters to apply
   * @param {string} [filters.search] - Search term for billing address fields
   * @param {number} [filters.page] - Page number
   * @param {number} [filters.pageSize] - Items per page
   * @param {boolean} fetchAll - Whether to fetch all records (bypassing pagination limits)
   * @returns {Promise<Object>} - List of billing addresses
   */
  async listBillingAddresses(filters = {}, fetchAll = false) {
    try {
      const queries = [Query.orderAsc("name"), Query.orderDesc("$createdAt")];

      if (fetchAll) {
        return await this.fetchAllDocuments(filters, queries);
      }

      return await this.listDocuments(filters, queries);
    } catch (error) {
      throw new Error(`Failed to list billing addresses: ${error.message}`);
    }
  }

  /**
   * Get all billing addresses
   * @param {Object} filters - Optional filters to apply
   * @returns {Promise<Array>} - Array of all billing addresses
   */
  async getAllBillingAddresses(filters = {}) {
    try {
      const result = await this.listBillingAddresses(filters, true);
      return result.documents;
    } catch (error) {
      throw new Error(`Failed to get all billing addresses: ${error.message}`);
    }
  }

  /**
   * Search billing addresses by name
   * @param {string} name - The name to search for
   * @param {boolean} fetchAll - Whether to fetch all matching records
   * @returns {Promise<Array>} - Array of billing addresses
   */
  async searchBillingAddressesByName(name, fetchAll = false) {
    try {
      if (!name || name.trim() === "") {
        return [];
      }

      const queries = [
        Query.search("name", name.trim()),
        Query.orderAsc("name"),
      ];

      if (fetchAll) {
        const result = await this.fetchAllDocuments({}, queries);
        return result.documents;
      }

      const result = await this.listDocuments({}, queries);
      return result.documents;
    } catch (error) {
      throw new Error(
        `Failed to search billing addresses by name: ${error.message}`
      );
    }
  }

  /**
   * Search billing addresses by email address
   * @param {string} email - The email address to search for
   * @param {boolean} exact - Whether to perform exact match or partial search
   * @param {boolean} fetchAll - Whether to fetch all matching records
   * @returns {Promise<Array>} - Array of billing addresses that match the email
   */
  async searchBillingAddressesByEmail(email, exact = true, fetchAll = false) {
    try {
      if (!email || email.trim() === "") {
        return [];
      }

      const queries = [
        exact
          ? Query.equal("email", email.trim().toLowerCase())
          : Query.search("email", email.trim()),
        Query.orderAsc("name"),
      ];

      if (fetchAll) {
        const result = await this.fetchAllDocuments({}, queries);
        return result.documents;
      }

      const result = await this.listDocuments({}, queries);
      return result.documents;
    } catch (error) {
      throw new Error(
        `Failed to search billing addresses by email: ${error.message}`
      );
    }
  }

  /**
   * Get billing address by exact email match
   * @param {string} email - The exact email to match
   * @returns {Promise<Object|null>} - The billing address document or null if not found
   */
  async getBillingAddressByExactEmail(email) {
    try {
      if (!email || email.trim() === "") {
        return null;
      }

      const addresses = await this.searchBillingAddressesByEmail(
        email,
        true,
        false
      );
      return addresses.length > 0 ? addresses[0] : null;
    } catch (error) {
      throw new Error(
        `Failed to get billing address by exact email: ${error.message}`
      );
    }
  }

  /**
   * Search billing addresses by name or email
   * @param {string} searchTerm - The search term to match against name or email
   * @param {boolean} fetchAll - Whether to fetch all matching records
   * @returns {Promise<Array>} - Array of billing addresses that match the search term
   */
  async searchBillingAddresses(searchTerm, fetchAll = false) {
    try {
      if (!searchTerm || searchTerm.trim() === "") {
        return [];
      }

      // Search by name
      const nameResults = await this.searchBillingAddressesByName(
        searchTerm,
        fetchAll
      );

      // Search by email (partial match)
      const emailResults = await this.searchBillingAddressesByEmail(
        searchTerm,
        false,
        fetchAll
      );

      // Combine results and remove duplicates
      const allResults = [...nameResults, ...emailResults];
      const uniqueResults = allResults.filter(
        (item, index, self) =>
          index === self.findIndex((t) => t.$id === item.$id)
      );

      return uniqueResults;
    } catch (error) {
      throw new Error(`Failed to search billing addresses: ${error.message}`);
    }
  }

  /**
   * Update billing address
   * @param {string} billingAddressId - Billing address ID
   * @param {Object} updates - Updates to apply
   * @param {string} [updates.name] - Updated name
   * @param {string} [updates.email] - Updated email
   * @param {string} [updates.address] - Updated address
   * @returns {Promise<Object>} - Updated billing address
   */
  async updateBillingAddress(billingAddressId, updates) {
    try {
      if (!billingAddressId) {
        throw new Error("Billing address ID is required");
      }

      const allowedUpdates = ["name", "email", "address"];

      // Get current billing address data for comparison
      const currentBillingAddress = await this.getBillingAddress(
        billingAddressId
      );
      if (!currentBillingAddress) {
        throw new Error("Billing address not found");
      }

      // Validate email format if email is being updated
      if (updates.email && updates.email !== currentBillingAddress.email) {
        if (!this.#isValidEmail(updates.email)) {
          throw new Error("Invalid email format");
        }
      }

      const updateData = Object.keys(updates)
        .filter((key) => allowedUpdates.includes(key))
        .reduce((obj, key) => {
          if (key === "email" && updates[key]) {
            obj[key] = updates[key].trim().toLowerCase();
          } else if (key === "name" && updates[key]) {
            obj[key] = updates[key].trim();
          } else if (key === "address" && updates[key]) {
            obj[key] = updates[key].trim();
          } else {
            obj[key] = updates[key];
          }
          return obj;
        }, {});

      if (Object.keys(updateData).length === 0) {
        throw new Error("No valid updates provided");
      }

      return await this.updateDocument(billingAddressId, updateData);
    } catch (error) {
      throw new Error(`Failed to update billing address: ${error.message}`);
    }
  }

  /**
   * Soft delete billing address
   * @param {string} billingAddressId - Billing address ID
   * @returns {Promise<Object>} - Deleted billing address
   */
  async deleteBillingAddress(billingAddressId) {
    try {
      if (!billingAddressId) {
        throw new Error("Billing address ID is required");
      }

      return await this.deleteDocument(billingAddressId);
    } catch (error) {
      throw new Error(`Failed to delete billing address: ${error.message}`);
    }
  }

  /**
   * Bulk update billing addresses
   * @param {Array} updates - Array of updates [{id, data}, ...]
   * @returns {Promise<Array>} - Array of updated billing addresses
   */
  async bulkUpdateBillingAddresses(updates) {
    try {
      if (!Array.isArray(updates) || updates.length === 0) {
        throw new Error("Updates array is required and cannot be empty");
      }

      return await Promise.all(
        updates.map(({ id, data }) => this.updateBillingAddress(id, data))
      );
    } catch (error) {
      throw new Error(
        `Failed to bulk update billing addresses: ${error.message}`
      );
    }
  }

  /**
   * Fetches all documents by handling pagination automatically
   * @param {Object} filters - Optional filters to apply
   * @param {Array} queries - Array of Query objects
   * @returns {Promise<Object>} - Combined result of all documents
   */
  async fetchAllDocuments(filters = {}, queries = []) {
    try {
      const initialResult = await this.listDocuments(filters, queries, 1, 0);
      const totalDocuments = initialResult.total;

      if (totalDocuments <= 25) {
        return await this.listDocuments(filters, queries);
      }

      const limit = 25;
      const requestsNeeded = Math.ceil(totalDocuments / limit);

      const promises = [];

      for (let i = 0; i < requestsNeeded; i++) {
        const offset = i * limit;
        promises.push(this.listDocuments(filters, queries, limit, offset));
      }

      const results = await Promise.all(promises);

      const allDocuments = results.reduce((acc, result) => {
        return acc.concat(result.documents);
      }, []);

      return {
        documents: allDocuments,
        total: totalDocuments,
      };
    } catch (error) {
      throw new Error(`Failed to fetch all documents: ${error.message}`);
    }
  }

  /**
   * Validate email format
   * @private
   * @param {string} email - Email to validate
   * @returns {boolean} - Whether email is valid
   */
  #isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

export const billingAddressService = new BillingAddressService();
export default BillingAddressService;

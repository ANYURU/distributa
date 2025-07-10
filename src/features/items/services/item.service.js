import { BaseService } from "../../../lib/appwrite/base-service";
import { appwriteConfig } from "../../../lib/appwrite/config";
import { account } from "../../../lib/appwrite/client";
import { Permission, Role, Query } from "appwrite";

class ItemService extends BaseService {
  constructor() {
    super(appwriteConfig.collections.items, ["title", "units"]);
  }

  sanitizeItem(item) {
    return {
      price: item.price,
      quantity: item.quantity,
      title: item.title,
      units: item.units,
    };
  }

  async createItem(payload) {
    const { $id: userId } = await account.get();

    const permissions = [
      Permission.read(Role.user(userId)),
      Permission.update(Role.user(userId)),
      Permission.delete(Role.user(userId)),
    ];

    return this.createDocument(this.sanitizeItem(payload), permissions);
  }

  async updateItem(itemId, payload) {
    const { $id: userId } = await account.get();

    const permissions = [
      Permission.read(Role.user(userId)),
      Permission.update(Role.user(userId)),
      Permission.delete(Role.user(userId)),
    ];

    return this.updateDocument(itemId, this.sanitizeItem(payload), permissions);
  }

  async deleteItem(itemId) {
    return this.deleteDocument(itemId);
  }

  /**
   * @function listItems
   * @description Lists items with optional search
   * @param {Object} filters - Filter options
   * @param {string} [filters.search] - Search term for item title
   * @param {number} [filters.page] - Page number
   * @param {number} [filters.pageSize] - Items per page
   * @returns {Promise<{documents: Array, total: number}>} - List of items
   */
  async listItems(filters = {}) {
    const serviceQueries = [];

    serviceQueries.push(Query.orderAsc("title"));

    return this.listDocuments(filters, serviceQueries);
  }

  /**
   * @function searchItemsByName
   * @description Searches for items by title/name and returns their IDs
   * @param {string} searchTerm - The search term to look for in item titles
   * @returns {Promise<string[]>} - Array of item IDs that match the search
   */
  async searchItemsByName(searchTerm) {
    if (!searchTerm || searchTerm.trim() === "") {
      return [];
    }

    try {
      const result = await this.listItems({
        search: searchTerm.trim(),
        pageSize: 100,
      });

      return result.documents.map((item) => item.$id);
    } catch (error) {
      console.error("Error searching items by name:", error);
      return [];
    }
  }

  /**
   * @function getItem
   * @description Get a single item by ID
   * @param {string} itemId - The item ID
   * @returns {Promise<Object>} - The item document
   */
  async getItem(itemId) {
    return this.getDocument(itemId);
  }

  /**
   * @function getItemsByIds
   * @description Get multiple items by their IDs
   * @param {string[]} itemIds - Array of item IDs
   * @returns {Promise<{documents: Array, total: number}>} - Items matching the IDs
   */
  async getItemsByIds(itemIds) {
    if (!itemIds || itemIds.length === 0) {
      return { documents: [], total: 0 };
    }

    const serviceQueries = [
      Query.equal("$id", itemIds),
      Query.orderAsc("title"),
    ];

    return this.listDocuments({}, serviceQueries);
  }
}

export const itemService = new ItemService();
export default ItemService;

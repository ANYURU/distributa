import { BaseService } from "../../../lib/appwrite/base-service";
import { appwriteConfig } from "../../../lib/appwrite/config";
import { account } from "../../../lib/appwrite/client";
import { Permission, Role, Query, ID } from "appwrite";

class CurrencyService extends BaseService {
  constructor() {
    super(appwriteConfig.collections.currencyPreferences, []);
  }

  /**
   * Get authenticated user ID
   * @private
   * @returns {Promise<string>} User ID
   * @throws {Error} If user is not authenticated
   */
  async #getUserId() {
    const userId = (await account.get())?.$id ?? null;
    if (!userId) {
      throw new Error("User not authenticated");
    }
    return userId;
  }

  /**
   * Sanitize currency data by removing Appwrite system attributes
   * @private
   * @param {Object} data - Currency data to sanitize
   * @returns {Object} Sanitized currency data
   */
  _sanitizeCurrencyData(data) {
    const appwriteAttributes = [
      "$id",
      "$createdAt",
      "$updatedAt",
      "$permissions",
      "$databaseId",
      "$collectionId",
    ];

    return Object.fromEntries(
      Object.entries(data).filter(([key]) => !appwriteAttributes.includes(key))
    );
  }

  /**
   * Fetch all documents with pagination support
   * @private
   * @param {Object} filters - Filter criteria
   * @param {Array} queries - Query filters
   * @returns {Promise<Array>} All documents
   */
  async #fetchAllDocuments(filters = {}, queries = []) {
    let allDocuments = [];
    let currentPage = 1;
    let hasMore = true;
    const limit = 100; // Maximum allowed by Appwrite

    while (hasMore) {
      const response = await this.listDocuments(
        { ...filters, page: currentPage, limit },
        queries
      );

      allDocuments = [...allDocuments, ...response.documents];
      currentPage++;

      hasMore = response.documents.length === limit;
    }

    return allDocuments;
  }

  /**
   * List currencies based on provided filters
   * @param {Object} filters - Filter criteria
   * @param {boolean} fetchAll - Whether to fetch all documents (pagination)
   * @returns {Promise<Object|Array>} List of currencies matching the filters
   */
  async listCurrencies(filters = {}, fetchAll = false) {
    const queries = [];

    if (filters?.is_available) {
      queries.push(Query.equal("is_available", filters.is_available));
    }

    if (filters?.is_preferred) {
      queries.push(Query.equal("is_preferred", filters.is_preferred));
    }

    if (filters?.user_id) {
      queries.push(Query.equal("user_id", filters.user_id));
    }

    if (fetchAll) {
      return this.#fetchAllDocuments(filters, queries);
    }

    return this.listDocuments(filters, queries);
  }

  /**
   * List available currencies for a specific user
   * If userId is not provided, uses the currently authenticated user
   * @param {string|null} [userId=null] - Optional user ID
   * @param {boolean} fetchAll - Whether to fetch all documents (pagination)
   * @returns {Promise<Object|Array>} List of available currencies for the user
   */
  async listAvailableCurrenciesByUserId(userId = null, fetchAll = true) {
    if (!userId) {
      userId = await this.#getUserId();
    }

    return this.listCurrencies(
      {
        is_available: true,
        user_id: userId,
      },
      fetchAll
    );
  }

  /**
   * Get the preferred currency for a user
   * @param {string|null} [userId=null] - Optional user ID
   * @returns {Promise<Object|null>} Preferred currency or null if none found
   */
  async getPreferredCurrency(userId = null) {
    if (!userId) {
      userId = await this.#getUserId();
    }

    const response = await this.listDocuments({}, [
      Query.equal("user_id", userId),
      Query.equal("is_preferred", true),
    ]);

    return response.total > 0 ? response.documents?.[0] : null;
  }

  /**
   * Get all currency preferences for a user
   * @param {string|null} [userId=null] - Optional user ID
   * @returns {Promise<Object>} Object containing preferred and available currencies
   */
  async getPreferences(userId = null) {
    if (!userId) {
      userId = await this.#getUserId();
    }

    try {
      const [preferred, available] = await Promise.all([
        this.getPreferredCurrency(userId),
        this.listAvailableCurrenciesByUserId(userId),
      ]);

      return {
        preferredCurrency: preferred,
        availableCurrencies: available,
      };
    } catch (error) {
      console.error("Error fetching currency preferences:", error);
      throw error;
    }
  }

  /**
   * Update currency preferences for a user
   * @param {Object} formData - Form data containing preferred and available currencies
   * @param {Object} formData.preferredCurrency - Preferred currency
   * @param {Array} formData.availableCurrencies - Available currencies
   * @param {string|null} [userId=null] - Optional user ID
   * @returns {Promise<Object>} Success message
   */
  async updatePreferences(formData, userId = null) {
    if (!userId) {
      userId = await this.#getUserId();
    }

    try {
      const { preferredCurrency, availableCurrencies } = formData;
      await this._handlePreferredCurrency(userId, preferredCurrency);
      await this._handleAvailableCurrencies(userId, availableCurrencies);

      return {
        message: "Currency preferences updated successfully",
      };
    } catch (error) {
      console.error("Error updating currency preferences:", error);
      throw error;
    }
  }

  /**
   * Handle preferred currency update or creation
   * @private
   * @param {string} userId - User ID
   * @param {Object} preferredCurrency - Preferred currency data
   * @returns {Promise<void>}
   */
  async _handlePreferredCurrency(userId, preferredCurrency) {
    try {
      const existing = await this.listDocuments({}, [
        Query.equal("user_id", userId),
        Query.equal("is_preferred", true),
      ]);

      const sanitizedData = this._sanitizeCurrencyData(preferredCurrency);

      if (existing.total === 0) {
        await this.createDocument(
          {
            user_id: userId,
            is_preferred: true,
            is_available: false,
            ...sanitizedData,
          },
          [
            Permission.read(Role.any()),
            Permission.update(Role.user(userId)),
            Permission.delete(Role.user(userId)),
          ]
        );
      } else {
        await this.updateDocument(existing?.documents[0]?.$id, {
          ...sanitizedData,
        });
      }
    } catch (error) {
      console.log("Error: ", JSON.stringify(error, null, 2));
      throw error;
    }
  }

  /**
   * Handle available currencies updates
   * @private
   * @param {string} userId - User ID
   * @param {Array} availableCurrencies - Available currencies data
   * @returns {Promise<void>}
   */
  async _handleAvailableCurrencies(userId, availableCurrencies) {
    const current = await this.listDocuments({}, [
      Query.equal("user_id", userId),
      Query.equal("is_available", true),
    ]);

    const currentCodes = new Set(current.documents.map(({ code }) => code));
    const newCodes = new Set(availableCurrencies.map(({ code }) => code));

    const toAdd = availableCurrencies.filter(
      ({ code }) => !currentCodes.has(code)
    );
    const toRemove = current.documents.filter(
      ({ code }) => !newCodes.has(code)
    );
    const toUpdate = current.documents.filter(({ code }) => newCodes.has(code));

    await this._removeAvailableCurrencies(toRemove);
    await this._addAvailableCurrencies(userId, toAdd);
    await this._updateAvailableCurrencies(current.documents, toUpdate);
  }

  /**
   * Remove available currencies
   * @private
   * @param {Array} currencies - Currencies to remove
   * @returns {Promise<void>}
   */
  async _removeAvailableCurrencies(currencies) {
    for (const currency of currencies) {
      await this.deleteDocument(currency.$id);
    }
  }

  /**
   * Add available currencies
   * @private
   * @param {string} userId - User ID
   * @param {Array} currencies - Currencies to add
   * @returns {Promise<void>}
   */
  async _addAvailableCurrencies(userId, currencies) {
    for (const currency of currencies) {
      const sanitizedCurrencyData = this._sanitizeCurrencyData(currency);

      await this.createDocument(
        {
          user_id: userId,
          is_preferred: false,
          is_available: true,
          ...sanitizedCurrencyData,
        },
        [
          Permission.read(Role.any()),
          Permission.update(Role.user(userId)),
          Permission.delete(Role.user(userId)),
        ]
      );
    }
  }

  /**
   * Update available currencies
   * @private
   * @param {Array} existingDocs - Existing currency documents
   * @param {Array} currencies - Currencies to update
   * @returns {Promise<void>}
   */
  async _updateAvailableCurrencies(existingDocs, currencies) {
    for (const currency of currencies) {
      const existingDoc = existingDocs.find(
        (doc) => doc.code === currency.code
      );
      if (existingDoc) {
        const sanitizedCurrencyData = this._sanitizeCurrencyData(currency);
        await this.updateDocument(existingDoc.$id, {
          ...sanitizedCurrencyData,
          is_preferred: false,
          is_available: true,
        });
      }
    }
  }

  /**
   * Get a currency preference by ID
   * @param {string} id - Currency preference ID
   * @returns {Promise<Object>} Currency preference document
   */
  async getCurrencyPreference(id) {
    return this.getDocument(id);
  }

  /**
   * Get a currency preference by currency code and user ID
   * @param {string} currencyCode - Currency code
   * @param {string|null} [userId=null] - Optional user ID
   * @returns {Promise<Object|null>} Currency preference document or null if not found
   */
  async getCurrencyPreferenceByCurrencyCode(currencyCode, userId = null) {
    if (!userId) {
      userId = await this.#getUserId();
    }

    const response = await this.listDocuments({}, [
      Query.equal("code", currencyCode),
      Query.equal("user_id", userId),
    ]);

    return response.total > 0 ? response.documents?.[0] : null;
  }

  /**
   * Create a new currency preference
   * @param {Object} data - Currency preference data
   * @param {string} data.code - Currency code
   * @param {string} data.name - Currency name
   * @param {string} data.symbol - Currency symbol
   * @param {boolean} [data.is_available=true] - Whether the currency is available
   * @param {boolean} [data.is_preferred=false] - Whether the currency is preferred
   * @param {string|null} [userId=null] - Optional user ID
   * @returns {Promise<Object>} Created currency preference document
   */
  async createCurrencyPreference(data, userId = null) {
    if (!userId) {
      userId = await this.#getUserId();
    }

    // Check if this currency already exists for the user
    const existing = await this.getCurrencyPreferenceByCurrencyCode(
      data.code,
      userId
    );

    if (existing) {
      throw new Error(`Currency preference for ${data.code} already exists`);
    }

    // Sanitize the data
    const sanitizedData = this._sanitizeCurrencyData(data);

    // Prepare document data
    const documentData = {
      user_id: userId,
      code: sanitizedData.code,
      name: sanitizedData.name,
      symbol: sanitizedData.symbol,
      is_available:
        sanitizedData.is_available !== undefined
          ? sanitizedData.is_available
          : true,
      is_preferred:
        sanitizedData.is_preferred !== undefined
          ? sanitizedData.is_preferred
          : false,
    };

    // If this is set as preferred, unset any existing preferred
    if (documentData.is_preferred) {
      await this._unsetPreferredCurrency(userId);
    }

    // Create document with appropriate permissions
    return this.createDocument(documentData, [
      Permission.read(Role.any()),
      Permission.update(Role.user(userId)),
      Permission.delete(Role.user(userId)),
    ]);
  }

  /**
   * Update a currency preference
   * @param {string} id - Currency preference ID
   * @param {Object} data - Currency preference data to update
   * @returns {Promise<Object>} Updated currency preference document
   */
  async updateCurrencyPreference(id, data) {
    const userId = await this.#getUserId();

    // Get the current document to check permissions
    const currentDoc = await this.getDocument(id);

    if (currentDoc.user_id !== userId) {
      throw new Error(
        "You don't have permission to update this currency preference"
      );
    }

    // Sanitize the data
    const sanitizedData = this._sanitizeCurrencyData(data);

    // If setting as preferred, unset any existing preferred
    if (sanitizedData.is_preferred) {
      await this._unsetPreferredCurrency(userId);
    }

    return this.updateDocument(id, sanitizedData);
  }

  /**
   * Delete a currency preference
   * @param {string} id - Currency preference ID
   * @returns {Promise<Object>} Delete result
   */
  async deleteCurrencyPreference(id) {
    const userId = await this.#getUserId();

    // Get the current document to check permissions
    const currentDoc = await this.getDocument(id);

    if (currentDoc.user_id !== userId) {
      throw new Error(
        "You don't have permission to delete this currency preference"
      );
    }

    // If deleting the preferred currency, we need to set another one as preferred
    if (currentDoc.is_preferred) {
      // Find another currency to set as preferred
      const currencies = await this.listAvailableCurrenciesByUserId(
        userId,
        true
      );
      const otherCurrencies = currencies.filter((c) => c.$id !== id);

      if (otherCurrencies.length > 0) {
        await this.updateDocument(otherCurrencies[0].$id, {
          is_preferred: true,
        });
      }
    }

    return this.deleteDocument(id);
  }

  /**
   * Unset the preferred currency for a user
   * @private
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async _unsetPreferredCurrency(userId) {
    // Find the current preferred currency
    const response = await this.listDocuments({}, [
      Query.equal("user_id", userId),
      Query.equal("is_preferred", true),
    ]);

    // Update all found documents (should be at most one)
    for (const doc of response.documents) {
      await this.updateDocument(doc.$id, { is_preferred: false });
    }
  }

  /**
   * Set a currency as the preferred for a user
   * @param {string} id - Currency preference ID to set as preferred
   * @returns {Promise<Object>} Updated currency preference document
   */
  async setPreferredCurrency(id) {
    const userId = await this.#getUserId();

    // Get the current document to check permissions
    const currentDoc = await this.getDocument(id);

    if (currentDoc.user_id !== userId) {
      throw new Error(
        "You don't have permission to update this currency preference"
      );
    }

    // Unset any existing preferred
    await this._unsetPreferredCurrency(userId);

    // Set this one as preferred
    return this.updateDocument(id, { is_preferred: true });
  }

  /**
   * Import multiple currency preferences for a user
   * @param {Array} currencies - Array of currency data to import
   * @param {string|null} [userId=null] - Optional user ID
   * @returns {Promise<Array>} Array of created currency preferences
   */
  async importCurrencies(currencies, userId = null) {
    if (!userId) {
      userId = await this.#getUserId();
    }

    const results = [];

    // Process in batches to avoid overwhelming the API
    for (const currency of currencies) {
      try {
        // Sanitize the data
        const sanitizedData = this._sanitizeCurrencyData(currency);

        const result = await this.createCurrencyPreference(
          {
            code: sanitizedData.code,
            name: sanitizedData.name,
            symbol: sanitizedData.symbol,
            is_available: true,
            is_preferred: sanitizedData.is_preferred || false,
          },
          userId
        );
        results.push(result);
      } catch (error) {
        console.error(
          `Failed to import currency ${currency.code}:`,
          error.message
        );
      }
    }

    return results;
  }
}

export const currencyService = new CurrencyService();
export default CurrencyService;

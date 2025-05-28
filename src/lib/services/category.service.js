import { BaseService } from "../appwrite/base-service";
import { appwriteConfig } from "../appwrite/config";
import { account } from "../appwrite/client";
import { Permission, Role, Query } from "appwrite";
import { format } from "date-fns";

import { monthlyStatementService } from "../../features/balances/services";
import { balanceOperationsService } from "../../features/balances/services";

/**
 * Category Service for managing categories across the application
 */
class CategoryService extends BaseService {
  /**
   * Create a new CategoryService instance
   * @param {Object} config - Configuration options
   * @param {string} config.collectionId - Override default collection ID
   * @param {string} config.flowType - Filter categories by flow type (income/expense/both)
   */
  constructor(config = {}) {
    const collectionId =
      config.collectionId || appwriteConfig.collections.categories;
    super(collectionId, ["name"]);

    this.flowType = config.flowType || null;
  }

  /**
   * Create a new category
   * @param {Object} categoryData - Category data
   * @returns {Promise<Object>} - Created category
   */
  async createCategory({
    name,
    parentId = null,
    flowType = "expense",
    icon = null,
    sortOrder = 100,
    description = null,
  }) {
    try {
      // Validate category name uniqueness
      const isNameValid = await this.#validateCategoryName(name, parentId);
      if (!isNameValid) {
        throw new Error("Category name already exists at this level");
      }

      const slug = this.#generateSlug(name);
      let ancestors = [];
      let level = 0;

      const currentUser = await this.account.get();

      // If parent exists, get its data
      if (parentId) {
        const parent = await this.getCategory(parentId);
        if (!parent) {
          throw new Error("Parent category not found");
        }
        ancestors = [...parent.ancestors, parent.$id];
        level = parent.level + 1;
      }

      const category = await this.createDocument(
        {
          name,
          slug,
          flow_type: flowType,
          parent_id: parentId,
          ancestors,
          level,
          is_active: true,
          sort_order: sortOrder,
          icon,
          description,
        },
        [
          Permission.read(Role.user(currentUser.$id)),
          Permission.update(Role.user(currentUser.$id)),
          Permission.delete(Role.user(currentUser.$id)),
        ]
      );

      return category;
    } catch (error) {
      throw new Error(`Failed to create category: ${error.message}`);
    }
  }

  /**
   * Get category by ID
   * @param {string} categoryId - Category ID
   * @returns {Promise<Object>} - Category document
   */
  async getCategory(categoryId) {
    try {
      return await this.getDocument(categoryId);
    } catch (error) {
      throw new Error(`Failed to get category: ${error.message}`);
    }
  }

  /**
   * List categories by flow type
   * @param {string} flowType - Flow type (income/expense/both)
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Categories list
   */
  async listByFlowType(flowType, options = { page: 1, pageSize: 100 }) {
    try {
      return await this.listDocuments(options, [
        Query.equal("flow_type", flowType),
        Query.equal("is_active", true),
      ]);
    } catch (error) {
      throw new Error(
        `Failed to list categories by flow type: ${error.message}`
      );
    }
  }

  /**
   * Get categories by IDs
   * @param {string[]} categoryIds - Array of category IDs
   * @returns {Promise<Object>} Categories list
   */
  async getByIds(categoryIds) {
    try {
      if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
        return { documents: [] };
      }

      return await this.listDocuments(
        { page: 1, pageSize: categoryIds.length },
        [Query.equal("$id", Query.in(categoryIds))]
      );
    } catch (error) {
      throw new Error(`Failed to get categories by IDs: ${error.message}`);
    }
  }

  /**
   * List categories with optional filters
   * @param {Object} filters - Optional filters to apply
   * @param {boolean} fetchAll - Whether to fetch all records (bypassing pagination limits)
   * @returns {Promise<Object>} - List of categories
   */
  async listCategories(filters = {}, fetchAll = false) {
    try {
      const queries = [
        Query.equal("is_active", true),
        Query.orderAsc("level"),
        Query.orderDesc("$createdAt"),
      ];

      const flowTypeFilter = filters.flow_type || this.flowType;
      if (flowTypeFilter) {
        queries.push(Query.equal("flow_type", flowTypeFilter));
      }

      if (fetchAll) {
        return await this.fetchAllDocuments(filters, queries);
      }

      return await this.listDocuments(filters, queries);
    } catch (error) {
      throw new Error(`Failed to list categories: ${error.message}`);
    }
  }

  /**
   * Get category tree
   * @param {Object} filters - Optional filters to apply
   * @returns {Promise<Array>} - Category tree
   */
  async getCategoryTree(filters = {}) {
    try {
      const queries = [
        Query.equal("is_active", true),
        Query.orderAsc("level"),
        Query.orderAsc("sort_order"),
        Query.orderDesc("$createdAt"),
      ];

      // Add flow type filter if specified in constructor
      const flowTypeFilter = filters.flow_type || this.flowType;
      if (this.flowTypeFilter) {
        queries.push(Query.equal("flow_type", flowTypeFilter));
      }

      const result = await this.fetchAllDocuments(filters, queries);
      return this.#buildCategoryTree(result.documents);
    } catch (error) {
      throw new Error(`Failed to get category tree: ${error.message}`);
    }
  }

  /**
   * Get children categories
   * @param {string} parentId - Parent category ID
   * @returns {Promise<Object>} - List of child categories
   */
  async getChildCategories(parentId) {
    try {
      const queries = [
        Query.equal("parent_id", parentId),
        Query.equal("is_active", true),
        Query.orderAsc("sort_order"),
      ];

      // Add flow type filter if specified in constructor
      if (this.flowType) {
        queries.push(Query.equal("flow_type", this.flowType));
      }

      return await this.fetchAllDocuments({}, queries);
    } catch (error) {
      throw new Error(`Failed to get child categories: ${error.message}`);
    }
  }

  /**
   * Get ancestor categories
   * @param {string} categoryId - Category ID
   * @returns {Promise<Array>} - List of ancestor categories
   */
  async getAncestors(categoryId) {
    try {
      const category = await this.getCategory(categoryId);

      if (!category.ancestors || !category.ancestors.length) {
        return [];
      }

      const queries = [Query.equal("$id", category.ancestors)];
      return await this.fetchAllDocuments({}, queries);
    } catch (error) {
      throw new Error(`Failed to get ancestors: ${error.message}`);
    }
  }

  /**
   * Update category
   * @param {string} categoryId - Category ID
   * @param {Object} updates - Updates to apply
   * @returns {Promise<Object>} - Updated category
   */
  async updateCategory(categoryId, updates) {
    try {
      const allowedUpdates = [
        "name",
        "icon",
        "is_active",
        "sort_order",
        "description",
        "flow_type",
      ];

      // Get current category data for comparison
      const currentCategory = await this.getCategory(categoryId);
      if (!currentCategory) {
        throw new Error("Category not found");
      }

      // Validate name uniqueness if name is being updated
      if (updates.name && updates.name !== currentCategory.name) {
        const isNameValid = await this.#validateCategoryName(
          updates.name,
          currentCategory.parent_id,
          categoryId
        );
        if (!isNameValid) {
          throw new Error("Category name already exists at this level");
        }
      }

      const updateData = Object.keys(updates)
        .filter((key) => allowedUpdates.includes(key))
        .reduce((obj, key) => {
          obj[key] = updates[key];
          return obj;
        }, {});

      if (updates.name) {
        updateData.slug = this.#generateSlug(updates.name);
      }

      // Handle flow type changes and related transaction updates
      if (
        updates.flow_type &&
        updates.flow_type !== currentCategory.flow_type
      ) {
        await this.#handleCategoryFlowTypeChange(
          categoryId,
          currentCategory.flow_type,
          updates.flow_type
        );
      }

      // Use the BaseService method for consistency
      return await this.updateDocument(categoryId, updateData);
    } catch (error) {
      throw new Error(`Failed to update category: ${error.message}`);
    }
  }

  /**
   * Soft delete category
   * @param {string} categoryId - Category ID
   * @returns {Promise<Object>} - Deleted category
   */
  async deleteCategory(categoryId) {
    try {
      // Check for child categories
      const children = await this.getChildCategories(categoryId);
      if (children.total > 0) {
        throw new Error("Cannot delete category with child categories");
      }

      // Soft delete by setting is_active to false
      return await this.updateDocument(categoryId, { is_active: false });
    } catch (error) {
      throw new Error(`Failed to delete category: ${error.message}`);
    }
  }

  /**
   * Restore a soft-deleted category
   * @param {string} categoryId - Category ID
   * @returns {Promise<Object>} - Restored category
   */
  async restoreCategory(categoryId) {
    try {
      const category = await this.getDocument(categoryId);

      // Check if parent is active
      if (category.parent_id) {
        const parent = await this.getDocument(category.parent_id);
        if (!parent || !parent.is_active) {
          throw new Error("Cannot restore category with inactive parent");
        }
      }

      return await this.updateDocument(categoryId, { is_active: true });
    } catch (error) {
      throw new Error(`Failed to restore category: ${error.message}`);
    }
  }

  /**
   * Move category to new parent
   * @param {string} categoryId - Category ID
   * @param {string|null} newParentId - New parent category ID
   * @returns {Promise<Object>} - Updated category
   */
  async moveCategory(categoryId, newParentId) {
    try {
      // Prevent moving to self
      if (categoryId === newParentId) {
        throw new Error("Cannot move category to itself");
      }

      const category = await this.getCategory(categoryId);
      if (!category) throw new Error("Category not found");

      const newParent = newParentId
        ? await this.getCategory(newParentId)
        : null;

      // Prevent circular references
      if (newParentId && newParent.ancestors.includes(categoryId)) {
        throw new Error("Cannot move category to its own descendant");
      }

      const ancestors = newParent
        ? [...newParent.ancestors, newParent.$id]
        : [];

      return await this.updateDocument(categoryId, {
        parent_id: newParentId,
        ancestors,
        level: ancestors.length,
      });
    } catch (error) {
      throw new Error(`Failed to move category: ${error.message}`);
    }
  }

  /**
   * Bulk update categories
   * @param {Array} updates - Array of updates [{id, data}, ...]
   * @returns {Promise<Array>} - Array of updated categories
   */
  async bulkUpdateCategories(updates) {
    try {
      return await Promise.all(
        updates.map(({ id, data }) => this.updateCategory(id, data))
      );
    } catch (error) {
      throw new Error(`Failed to bulk update categories: ${error.message}`);
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
   * Helper method to build tree structure
   * @private
   * @param {Array} categories - List of categories
   * @returns {Array} - Tree structure
   */
  #buildCategoryTree(categories) {
    const categoryMap = {};
    const roots = [];

    // Create nodes and map
    categories.forEach((category) => {
      categoryMap[category.$id] = { ...category, children: [] };
    });

    // Build tree
    categories.forEach((category) => {
      if (category.parent_id && categoryMap[category.parent_id]) {
        categoryMap[category.parent_id].children.push(
          categoryMap[category.$id]
        );
      } else {
        roots.push(categoryMap[category.$id]);
      }
    });

    return roots;
  }

  /**
   * Helper method to generate slug
   * @private
   * @param {string} name - Category name
   * @returns {string} - Generated slug
   */
  #generateSlug(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  /**
   * Validate category name uniqueness at the same level
   * @private
   * @param {string} name - Category name
   * @param {string|null} parentId - Parent category ID
   * @param {string|null} excludeId - Category ID to exclude from check (for updates)
   * @returns {Promise<boolean>} - Whether name is valid
   */
  async #validateCategoryName(name, parentId, excludeId = null) {
    const queries = [
      Query.equal("name", name),
      Query.equal("parent_id", parentId || null),
    ];

    if (excludeId) {
      queries.push(Query.notEqual("$id", excludeId));
    }

    const { total } = await this.listDocuments({}, queries, 1);
    return total === 0;
  }

  /**
   * Handle category flow type change and update related transactions
   * @private
   * @param {string} categoryId - Category ID
   * @param {string} prevFlowType - Previous category flow type
   * @param {string} newFlowType - New category flow type
   * @returns {Promise<void>}
   */
  async #handleCategoryFlowTypeChange(categoryId, prevFlowType, newFlowType) {
    const { $id: userId } = await account.get();

    // Update child categories first
    const children = await this.getChildCategories(categoryId);
    let updatedCategories = [categoryId];

    if (children.total > 0) {
      const updatedChildren = await Promise.all(
        children.documents.map(async (child) => {
          const { $id: childId } = await this.updateCategory(child.$id, {
            flow_type: newFlowType,
          });
          return childId;
        })
      );
      updatedCategories = [...updatedCategories, ...updatedChildren];
    }

    // Update related transactions
    await this.#updateTransactionsForCategoryFlowTypeChange(
      updatedCategories,
      prevFlowType,
      newFlowType,
      userId
    );
  }

  /**
   * Update transactions when category flow type changes
   * @private
   * @param {Array} categoryIds - Array of category IDs
   * @param {string} prevFlowType - Previous category flow type
   * @param {string} newFlowType - New category flow type
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async #updateTransactionsForCategoryFlowTypeChange(
    categoryIds,
    prevFlowType,
    newFlowType,
    userId
  ) {
    let offset = 0;
    const limit = 100;

    while (true) {
      const queries = [
        Query.limit(limit),
        Query.offset(offset),
        Query.orderDesc("$createdAt"),
      ];

      // Use the BaseService method for consistency
      const { documents: transactions, total: totalTransactions } =
        await this.databases.listDocuments(
          appwriteConfig.databaseId,
          appwriteConfig.collections.transactions,
          queries
        );

      if (totalTransactions === 0) break;

      const relevantTransactions = transactions.filter((transaction) =>
        categoryIds.includes(transaction.category.$id)
      );

      if (relevantTransactions.length > 0) {
        await Promise.all(
          relevantTransactions.map((transaction) =>
            this.#updateTransactionForCategoryFlowTypeChange(
              transaction,
              prevFlowType,
              newFlowType,
              userId
            )
          )
        );
      }

      if (transactions.length < limit) break;
      offset += limit;
    }
  }

  /**
   * Update a single transaction for category flow type change
   * @private
   * @param {Object} transaction - Transaction document
   * @param {string} prevFlowType - Previous category flow type
   * @param {string} newFlowType - New category flow type
   * @param {string} userId - User ID
   * @returns {Promise<Array>} - Array of promises
   */
  async #updateTransactionForCategoryFlowTypeChange(
    transaction,
    prevFlowType,
    newFlowType,
    userId
  ) {
    try {
      // Get the transaction date in YYYY-MM format
      const transactionDate = new Date(transaction.date);
      const yearMonth = format(transactionDate, "yyyy-MM");

      // Use monthlyStatementService to get the monthly statement
      const monthlyStatement =
        await monthlyStatementService.getByUserIdAndYearMonth(
          userId,
          yearMonth
        );

      if (!monthlyStatement) return null;

      // Determine the flow type change scenario
      let updatePromises = [];

      // Update the transaction flow type
      const transactionUpdate = this.databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.transactions,
        transaction.$id,
        { flow_type: newFlowType }
      );

      updatePromises.push(transactionUpdate);

      // Handle different flow type change scenarios by updating balances
      if (prevFlowType !== newFlowType) {
        // For income -> expense: revert income and add expense
        if (prevFlowType === "income" && newFlowType === "expense") {
          // Revert the income transaction
          await balanceOperationsService.revertBalanceUpdate(
            transaction.amount,
            "income",
            transactionDate,
            transaction.category.$id
          );

          // Add as expense transaction
          await balanceOperationsService.updateBalances(
            transaction.amount,
            "expense",
            transactionDate,
            transaction.category.$id
          );
        }
        // For expense -> income: revert expense and add income
        else if (prevFlowType === "expense" && newFlowType === "income") {
          // Revert the expense transaction
          await balanceOperationsService.revertBalanceUpdate(
            transaction.amount,
            "expense",
            transactionDate,
            transaction.category.$id
          );

          // Add as income transaction
          await balanceOperationsService.updateBalances(
            transaction.amount,
            "income",
            transactionDate,
            transaction.category.$id
          );
        }
        // Handle "both" flow type changes
        else if (prevFlowType === "both") {
          if (newFlowType === "income" && transaction.flow_type === "expense") {
            // Revert the expense transaction
            await balanceOperationsService.revertBalanceUpdate(
              transaction.amount,
              "expense",
              transactionDate,
              transaction.category.$id
            );

            // Add as income transaction
            await balanceOperationsService.updateBalances(
              transaction.amount,
              "income",
              transactionDate,
              transaction.category.$id
            );
          } else if (
            newFlowType === "expense" &&
            transaction.flow_type === "income"
          ) {
            // Revert the income transaction
            await balanceOperationsService.revertBalanceUpdate(
              transaction.amount,
              "income",
              transactionDate,
              transaction.category.$id
            );

            // Add as expense transaction
            await balanceOperationsService.updateBalances(
              transaction.amount,
              "expense",
              transactionDate,
              transaction.category.$id
            );
          }
        }
      }

      return Promise.all(updatePromises);
    } catch (error) {
      console.error(
        "Error updating transaction for category flow type change:",
        error
      );
      throw error;
    }
  }
}

export const categoryService = new CategoryService();
export default categoryService;

import { BaseService } from "../../../lib/appwrite/base-service";
import { appwriteConfig } from "../../../lib/appwrite/config";
import { format } from "date-fns";
import { account } from "../../../lib/appwrite/client";

import accountSummaryService from "./account-summary.service";
import monthlyStatementService from "./monthly-statement.service";
import categoryService from "../../../lib/services/category.service";
import categoryTotalService from "./category-total.service";
import balanceOperationsService from "./balance-operations.service";
import balanceAnalyticsService from "./balance-analytics.service";

/**
 * Facade service that coordinates between specialized balance services
 */
class BalancesService extends BaseService {
  constructor() {
    // Initialize with the collection ID for the main collection this service manages
    super(appwriteConfig.collections.accountSummaries, []);
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
   * Initialize or get user balance record
   * @param {string} [currency="USD"] - Default currency
   * @returns {Promise<Object>} User balance document
   */
  async initializeUserBalance(currency = "USD") {
    try {
      const userId = await this.#getUserId();
      let userBalance = await accountSummaryService.getByUserId(userId);

      if (!userBalance) {
        userBalance = await accountSummaryService.create(userId, { currency });
      }

      return userBalance;
    } catch (error) {
      throw new Error(`Failed to initialize user balance: ${error.message}`);
    }
  }

  /**
   * Get or create monthly balance record
   * @param {string|Date} date - Date to get monthly balance for
   * @returns {Promise<Object>} Monthly balance document
   */
  async getOrCreateMonthlyBalance(date) {
    try {
      const userId = await this.#getUserId();
      const yearMonth = format(new Date(date), "yyyy-MM");

      let monthlyStatement =
        await monthlyStatementService.getByUserIdAndYearMonth(
          userId,
          yearMonth
        );

      if (!monthlyStatement) {
        monthlyStatement = await monthlyStatementService.create(
          userId,
          yearMonth
        );
      }

      return monthlyStatement;
    } catch (error) {
      throw new Error(`Failed to get/create monthly balance: ${error.message}`);
    }
  }

  /**
   * Update or create monthly category total
   * @param {string} monthlyStatementId - Monthly statement ID
   * @param {string} categoryId - Category ID
   * @param {number} amount - Amount to add
   * @returns {Promise<Object>} Updated category total
   */
  async updateMonthlyCategoryTotal(monthlyStatementId, categoryId, amount) {
    try {
      const userId = await this.#getUserId();
      const categoryTotal =
        await categoryTotalService.getByStatementAndCategory(
          monthlyStatementId,
          categoryId
        );

      if (categoryTotal) {
        return await categoryTotalService.update(categoryTotal.$id, {
          amount: categoryTotal.amount + amount,
        });
      } else {
        return await categoryTotalService.create(
          userId,
          monthlyStatementId,
          categoryId,
          amount
        );
      }
    } catch (error) {
      throw new Error(
        `Failed to update monthly category total: ${error.message}`
      );
    }
  }

  /**
   * Update balances after a new transaction
   * @param {number} amount - Transaction amount
   * @param {string} flow_type - Transaction type (income/expense)
   * @param {string|Date} date - Transaction date
   * @param {string|null} categoryId - Category ID
   * @returns {Promise<Object>} Updated balances
   */
  async updateBalances(amount, flow_type, date, categoryId = null) {
    return balanceOperationsService.updateBalances(
      amount,
      flow_type,
      date,
      categoryId
    );
  }

  /**
   * Get monthly statistics with category details
   * @param {string} yearMonth - Year and month in format YYYY-MM
   * @returns {Promise<Object|null>} Monthly statistics
   */
  async getMonthlyStats(yearMonth) {
    try {
      // Validate yearMonth format
      if (!/^\d{4}-\d{2}$/.test(yearMonth)) {
        throw new Error("Invalid yearMonth format. Expected YYYY-MM");
      }

      const userId = await this.#getUserId();

      // Get monthly statement
      const monthlyStatement =
        await monthlyStatementService.getByUserIdAndYearMonth(
          userId,
          yearMonth
        );
      if (!monthlyStatement) {
        return null;
      }

      // Get category totals for this monthly statement
      const categoryTotals = await categoryTotalService.getAllByStatement(
        monthlyStatement.$id
      );

      // Get all categories referenced in the totals
      const categoryIds = categoryTotals.documents.map((ct) => ct.category_id);
      const categories = await categoryService.getByIds(categoryIds);

      // Calculate category breakdown with details
      const categoryBreakdown = categories.documents.map((category) => {
        const categoryTotal = categoryTotals.documents.find(
          (ct) => ct.category_id === category.$id
        );

        // Avoid division by zero
        const totalForType =
          category.flow_type === "expense"
            ? Math.max(monthlyStatement.expense, 0.01)
            : Math.max(monthlyStatement.income, 0.01);

        return {
          id: category.$id,
          name: category.name,
          icon: category.icon,
          flow_type: category.flow_type,
          total: categoryTotal?.amount || 0,
          percentage: ((categoryTotal?.amount || 0) / totalForType) * 100,
        };
      });

      return {
        income: monthlyStatement.income,
        expenses: monthlyStatement.expense,
        netSavings: monthlyStatement.income - monthlyStatement.expense,
        transactionCount: monthlyStatement.number_of_transactions,
        averageTransaction: monthlyStatement.average_transaction_amount,
        largestTransaction: monthlyStatement.largest_transaction_amount,
        budgetUtilised: monthlyStatement.budget_utilised,
        categoryBreakdown,
      };
    } catch (error) {
      throw new Error(`Failed to get monthly stats: ${error.message}`);
    }
  }

  /**
   * Get monthly balances for a date range
   * @param {string|Date} startDate - Start date
   * @param {string|Date} endDate - End date
   * @returns {Promise<Object>} Monthly balances
   */
  async getMonthlyBalances(startDate, endDate) {
    try {
      const userId = await this.#getUserId();
      const formattedStartDate = format(new Date(startDate), "yyyy-MM");
      const formattedEndDate = format(new Date(endDate), "yyyy-MM");

      return await monthlyStatementService.getByDateRange(
        userId,
        formattedStartDate,
        formattedEndDate
      );
    } catch (error) {
      throw new Error(`Failed to fetch monthly balances: ${error.message}`);
    }
  }

  /**
   * Get current month Summary
   * @returns {Promise<Object>} Current month summary
   */
  async getCurrentMonthSummary() {
    try {
      const userId = await this.#getUserId();
      const yearMonth = format(new Date(), "yyyy-MM");

      return await monthlyStatementService.getByUserIdAndYearMonth(
        userId,
        yearMonth
      );
    } catch (error) {
      throw new Error(
        `Failed to get current monthly balance: ${error.message}`
      );
    }
  }

  /**
   * Update budget limit
   * @param {number} newLimit - New budget limit
   * @returns {Promise<Object>} Updated user balance
   */
  async updateBudgetLimit(newLimit) {
    try {
      if (typeof newLimit !== "number" || isNaN(newLimit) || newLimit < 0) {
        throw new Error("Budget limit must be a non-negative number");
      }

      const userBalance = await this.initializeUserBalance();
      return await accountSummaryService.update(userBalance.$id, {
        budget_limit: newLimit,
      });
    } catch (error) {
      throw new Error(`Failed to update budget limit: ${error.message}`);
    }
  }

  /**
   * Update savings goal
   * @param {number} newGoal - New savings goal
   * @returns {Promise<Object>} Updated user balance
   */
  async updateSavingsGoal(newGoal) {
    try {
      if (typeof newGoal !== "number" || isNaN(newGoal) || newGoal < 0) {
        throw new Error("Savings goal must be a non-negative number");
      }

      const userBalance = await this.initializeUserBalance();
      return await accountSummaryService.update(userBalance.$id, {
        savings_goal: newGoal,
      });
    } catch (error) {
      throw new Error(`Failed to update savings goal: ${error.message}`);
    }
  }

  /**
   * Get current user balance
   * @returns {Promise<number>} Current balance
   */
  async getCurrentBalance() {
    try {
      const userBalance = await this.initializeUserBalance();
      return userBalance.current_balance;
    } catch (error) {
      throw new Error(`Failed to get current balance: ${error.message}`);
    }
  }

  /**
   * Revert balance updates if transaction creation fails
   * @param {number} amount - Transaction amount
   * @param {string} flow_type - Transaction type (income/expense)
   * @param {string|Date} date - Transaction date
   * @param {string|null} categoryId - Category ID
   * @returns {Promise<Object>} Updated balances
   */
  async revertBalanceUpdate(amount, flow_type, date, categoryId = null) {
    return balanceOperationsService.revertBalanceUpdate(
      amount,
      flow_type,
      date,
      categoryId
    );
  }

  /**
   * Helper method to get a document from a specific collection
   * @param {string} documentId - Document ID
   * @param {string} collectionId - Collection ID
   * @returns {Promise<Object>} Document
   */
  async getDocument(documentId, collectionId) {
    try {
      if (collectionId === appwriteConfig.collections.categories) {
        return await categoryService.get(documentId);
      }

      return await this.databases.getDocument(
        appwriteConfig.databaseId,
        collectionId,
        documentId
      );
    } catch (error) {
      throw new Error(`Failed to get document: ${error.message}`);
    }
  }

  // ========== ANALYTICS METHODS ==========

  /**
   * Get spending trends over time
   * @param {number} months - Number of months to analyze
   * @returns {Promise<Object>} Spending trends
   */
  async getSpendingTrends(months = 6) {
    try {
      return await balanceAnalyticsService.getSpendingTrends(months);
    } catch (error) {
      throw new Error(`Failed to get spending trends: ${error.message}`);
    }
  }

  /**
   * Get category spending analysis
   * @param {number} months - Number of months to analyze
   * @returns {Promise<Object>} Category spending analysis
   */
  async getCategoryAnalysis(months = 3) {
    try {
      return await balanceAnalyticsService.getCategoryAnalysis(months);
    } catch (error) {
      throw new Error(`Failed to get category analysis: ${error.message}`);
    }
  }

  /**
   * Get budget utilization analysis
   * @param {number} months - Number of months to analyze
   * @returns {Promise<Object>} Budget utilization analysis
   */
  async getBudgetUtilization(months = 6) {
    try {
      return await balanceAnalyticsService.getBudgetUtilization(months);
    } catch (error) {
      throw new Error(`Failed to get budget utilization: ${error.message}`);
    }
  }

  /**
   * Get financial health score
   * @returns {Promise<Object>} Financial health analysis
   */
  async getFinancialHealthScore() {
    try {
      return await balanceAnalyticsService.getFinancialHealthScore();
    } catch (error) {
      throw new Error(
        `Failed to calculate financial health score: ${error.message}`
      );
    }
  }

  /**
   * Compare two months
   * @param {string} month1 - First month in format YYYY-MM
   * @param {string} month2 - Second month in format YYYY-MM
   * @returns {Promise<Object>} Comparison between two months
   */
  async compareMonths(month1, month2) {
    try {
      return await balanceAnalyticsService.compareMonths(month1, month2);
    } catch (error) {
      throw new Error(`Failed to compare months: ${error.message}`);
    }
  }
}

export const balancesService = new BalancesService();
export default balancesService;

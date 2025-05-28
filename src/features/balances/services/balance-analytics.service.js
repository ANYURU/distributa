import { format, subMonths, startOfMonth } from "date-fns";
import { BaseService } from "../../../lib/appwrite/base-service";
import { appwriteConfig } from "../../../lib/appwrite/config";
import monthlyStatementService from "./monthly-statement.service";
import categoryTotalService from "./category-total.service";
import accountSummaryService from "./account-summary.service";
import categoryService from "../../../lib/services/category.service";
import { account } from "../../../lib/appwrite/client";

/**
 * Service for financial analytics and reporting
 */
class BalanceAnalyticsService extends BaseService {
  constructor() {
    super(appwriteConfig.collections.monthlyStatements, []);
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
   * Process large datasets in batches
   * @private
   * @param {Array} items - Items to process
   * @param {Function} processFn - Processing function for each batch
   * @param {number} batchSize - Size of each batch
   * @returns {Promise<Array>} Processed results
   */
  async #processBatches(items, processFn, batchSize = 100) {
    const results = [];

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await processFn(batch);
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Get spending trends over time
   * @param {number} months - Number of months to analyze
   * @returns {Promise<Object>} Spending trends
   */
  async getSpendingTrends(months = 6) {
    try {
      if (!Number.isInteger(months) || months < 1) {
        throw new Error("Months must be a positive integer");
      }

      const userId = await this.#getUserId();
      const endDate = new Date();
      const startDate = subMonths(startOfMonth(endDate), months - 1);

      const formattedStartDate = format(startDate, "yyyy-MM");
      const formattedEndDate = format(endDate, "yyyy-MM");

      // Use monthlyStatementService to get statements for date range
      const monthlyStatementsResult =
        await monthlyStatementService.getByDateRange(
          userId,
          formattedStartDate,
          formattedEndDate,
          { orderDesc: false } // Order by ascending date
        );

      const monthlyBalancesDocuments = monthlyStatementsResult.documents;

      // Calculate trends
      const trends = {
        months: monthlyBalancesDocuments.map((doc) => doc.year_month),
        income: monthlyBalancesDocuments.map((doc) => doc.income),
        expenses: monthlyBalancesDocuments.map((doc) => doc.expense),
        savings: monthlyBalancesDocuments.map(
          (doc) => doc.income - doc.expense
        ),
        averageIncome: 0,
        averageExpenses: 0,
        averageSavings: 0,
        incomeGrowth: 0,
        expenseGrowth: 0,
        savingsRate: 0,
      };

      // Calculate averages
      if (trends.months.length > 0) {
        trends.averageIncome =
          trends.income.reduce((a, b) => a + b, 0) / trends.income.length;
        trends.averageExpenses =
          trends.expenses.reduce((a, b) => a + b, 0) / trends.expenses.length;
        trends.averageSavings =
          trends.savings.reduce((a, b) => a + b, 0) / trends.savings.length;

        // Calculate growth (if we have at least 2 months of data)
        if (trends.months.length >= 2) {
          const firstIncome = trends.income[0];
          const lastIncome = trends.income[trends.income.length - 1];
          const firstExpense = trends.expenses[0];
          const lastExpense = trends.expenses[trends.expenses.length - 1];

          trends.incomeGrowth =
            firstIncome > 0
              ? ((lastIncome - firstIncome) / firstIncome) * 100
              : 0;

          trends.expenseGrowth =
            firstExpense > 0
              ? ((lastExpense - firstExpense) / firstExpense) * 100
              : 0;
        }

        // Calculate overall savings rate
        const totalIncome = trends.income.reduce((a, b) => a + b, 0);
        const totalExpenses = trends.expenses.reduce((a, b) => a + b, 0);
        trends.savingsRate =
          totalIncome > 0
            ? ((totalIncome - totalExpenses) / totalIncome) * 100
            : 0;
      }

      return trends;
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
      if (!Number.isInteger(months) || months < 1) {
        throw new Error("Months must be a positive integer");
      }

      const userId = await this.#getUserId();
      const endDate = new Date();
      const startDate = subMonths(startOfMonth(endDate), months - 1);

      const formattedStartDate = format(startDate, "yyyy-MM");
      const formattedEndDate = format(endDate, "yyyy-MM");

      // Use monthlyStatementService to get statements for date range
      const monthlyStatementsResult =
        await monthlyStatementService.getByDateRange(
          userId,
          formattedStartDate,
          formattedEndDate,
          { orderDesc: false } // Order by ascending date
        );

      const monthlyStatementsDocuments = monthlyStatementsResult.documents;

      if (monthlyStatementsDocuments.length === 0) {
        return { categories: [], totalSpent: 0 };
      }

      // Get all category totals for these statements
      const statementIds = monthlyStatementsDocuments.map((doc) => doc.$id);

      // Create a map to store category totals
      const categoryTotalsMap = new Map();

      // Process statements in batches to avoid memory issues
      await this.#processBatches(
        statementIds,
        async (batchStatementIds) => {
          const batchResults = [];

          for (const statementId of batchStatementIds) {
            // Use categoryTotalService to get category totals
            const categoryTotalsResult =
              await categoryTotalService.getAllByStatement(statementId);
            const categoryTotalsDocuments = categoryTotalsResult.documents;

            for (const total of categoryTotalsDocuments) {
              const currentTotal =
                categoryTotalsMap.get(total.category_id) || 0;
              categoryTotalsMap.set(
                total.category_id,
                currentTotal + total.amount
              );
            }

            batchResults.push(categoryTotalsDocuments);
          }

          return batchResults;
        },
        10
      ); // Process 10 statements at a time

      if (categoryTotalsMap.size === 0) {
        return { categories: [], totalSpent: 0 };
      }

      // Get category details
      const categoryIds = Array.from(categoryTotalsMap.keys());

      // Fetch categories in batches if there are many
      const categoriesDocuments = await this.#processBatches(
        categoryIds,
        async (batchCategoryIds) => {
          const categories = await categoryService.getByIds(batchCategoryIds);
          return categories.documents;
        },
        100
      ); // Process 100 categories at a time

      // Calculate total spent
      const totalSpent = Array.from(categoryTotalsMap.values()).reduce(
        (a, b) => a + b,
        0
      );

      // Prepare category analysis
      const categoryAnalysis = categoriesDocuments.flat().map((category) => {
        const amount = categoryTotalsMap.get(category.$id) || 0;
        return {
          id: category.$id,
          name: category.name,
          icon: category.icon,
          flow_type: category.flow_type,
          amount,
          percentage: totalSpent > 0 ? (amount / totalSpent) * 100 : 0,
          monthlyAverage: amount / months,
        };
      });

      // Sort by amount (highest first)
      categoryAnalysis.sort((a, b) => b.amount - a.amount);

      return {
        categories: categoryAnalysis,
        totalSpent,
        monthlyAverage: totalSpent / months,
        period: {
          startDate: formattedStartDate,
          endDate: formattedEndDate,
          months,
        },
      };
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
      if (!Number.isInteger(months) || months < 1) {
        throw new Error("Months must be a positive integer");
      }

      const userId = await this.#getUserId();
      const endDate = new Date();
      const startDate = subMonths(startOfMonth(endDate), months - 1);

      const formattedStartDate = format(startDate, "yyyy-MM");
      const formattedEndDate = format(endDate, "yyyy-MM");

      // Use monthlyStatementService to get statements for date range
      const monthlyStatementsResult =
        await monthlyStatementService.getByDateRange(
          userId,
          formattedStartDate,
          formattedEndDate,
          { orderDesc: false } // Order by ascending date
        );

      const monthlyStatementsDocuments = monthlyStatementsResult.documents;

      if (monthlyStatementsDocuments.length === 0) {
        return {
          months: [],
          budgetUtilized: [],
          averageUtilization: 0,
        };
      }

      // Use accountSummaryService to get user's budget limit
      const accountSummary = await accountSummaryService.getByUserId(userId);
      const budgetLimit = accountSummary ? accountSummary.budget_limit : 0;

      // Calculate budget utilization for each month
      const budgetAnalysis = {
        months: monthlyStatementsDocuments.map((doc) => doc.year_month),
        budgetUtilized: monthlyStatementsDocuments.map(
          (doc) => doc.budget_utilised
        ),
        budgetLimit: Array(monthlyStatementsDocuments.length).fill(budgetLimit),
        utilizationRate: monthlyStatementsDocuments.map((doc) =>
          budgetLimit > 0 ? (doc.budget_utilised / budgetLimit) * 100 : 0
        ),
        averageUtilization: 0,
        overBudgetMonths: 0,
      };

      // Calculate average utilization and count over-budget months
      if (budgetAnalysis.months.length > 0) {
        const totalUtilization = budgetAnalysis.utilizationRate.reduce(
          (a, b) => a + b,
          0
        );
        budgetAnalysis.averageUtilization =
          totalUtilization / budgetAnalysis.months.length;

        budgetAnalysis.overBudgetMonths = budgetAnalysis.utilizationRate.filter(
          (rate) => rate > 100
        ).length;
      }

      return budgetAnalysis;
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
      // Get spending trends for the last 6 months
      const trends = await this.getSpendingTrends(6);

      // Get category analysis for the last 3 months
      const categoryAnalysis = await this.getCategoryAnalysis(3);

      // Get budget utilization for the last 6 months
      const budgetAnalysis = await this.getBudgetUtilization(6);

      // Calculate financial health score (0-100)
      let score = 0;
      let maxScore = 0;
      let factors = [];

      // Factor 1: Savings rate (0-30 points)
      const savingsRateScore = Math.min(30, trends.savingsRate);
      score += savingsRateScore;
      maxScore += 30;
      factors.push({
        name: "Savings Rate",
        score: savingsRateScore,
        maxScore: 30,
        value: `${trends.savingsRate.toFixed(1)}%`,
        description:
          trends.savingsRate >= 20
            ? "Excellent savings rate"
            : trends.savingsRate >= 10
            ? "Good savings rate"
            : "Needs improvement",
      });

      // Factor 2: Budget adherence (0-25 points)
      const budgetScore =
        budgetAnalysis.averageUtilization <= 100
          ? 25
          : Math.max(0, 25 - (budgetAnalysis.averageUtilization - 100) / 2);
      score += budgetScore;
      maxScore += 25;
      factors.push({
        name: "Budget Adherence",
        score: budgetScore,
        maxScore: 25,
        value: `${budgetAnalysis.averageUtilization.toFixed(1)}%`,
        description:
          budgetAnalysis.averageUtilization <= 90
            ? "Excellent budget management"
            : budgetAnalysis.averageUtilization <= 100
            ? "Good budget management"
            : "Over budget",
      });

      // Factor 3: Income stability (0-20 points)
      // Calculate coefficient of variation (lower is better)
      let incomeStabilityScore = 20;
      if (trends.income.length >= 2) {
        const mean = trends.averageIncome;
        const variance =
          trends.income.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
          trends.income.length;
        const stdDev = Math.sqrt(variance);
        const cv = mean > 0 ? (stdDev / mean) * 100 : 100;

        // Convert CV to score (lower CV = higher score)
        incomeStabilityScore = Math.max(0, 20 - cv / 5);
      }
      score += incomeStabilityScore;
      maxScore += 20;
      factors.push({
        name: "Income Stability",
        score: incomeStabilityScore,
        maxScore: 20,
        value:
          incomeStabilityScore >= 15
            ? "Stable"
            : incomeStabilityScore >= 10
            ? "Moderate"
            : "Volatile",
        description:
          incomeStabilityScore >= 15
            ? "Consistent income"
            : incomeStabilityScore >= 10
            ? "Moderately stable income"
            : "Inconsistent income",
      });

      // Factor 4: Expense distribution (0-15 points)
      // Check if expenses are well-distributed or concentrated in few categories
      let expenseDistributionScore = 15;
      if (categoryAnalysis.categories.length > 0) {
        // Calculate Herfindahl-Hirschman Index (HHI) for expense concentration
        // Lower HHI = better distribution
        const expenseCategories = categoryAnalysis.categories.filter(
          (c) => c.flow_type === "expense"
        );
        if (expenseCategories.length > 0) {
          const totalExpense = expenseCategories.reduce(
            (sum, cat) => sum + cat.amount,
            0
          );
          const hhi =
            expenseCategories.reduce((sum, cat) => {
              const marketShare =
                totalExpense > 0 ? cat.amount / totalExpense : 0;
              return sum + marketShare * marketShare;
            }, 0) * 10000; // Scale to 0-10000

          // Convert HHI to score (lower HHI = higher score)
          expenseDistributionScore = Math.max(0, 15 - hhi / 1000);
        }
      }
      score += expenseDistributionScore;
      maxScore += 15;
      factors.push({
        name: "Expense Distribution",
        score: expenseDistributionScore,
        maxScore: 15,
        value:
          expenseDistributionScore >= 10 ? "Well-distributed" : "Concentrated",
        description:
          expenseDistributionScore >= 10
            ? "Well-distributed expenses"
            : "Expenses concentrated in few categories",
      });

      // Factor 5: Expense trend (0-10 points)
      const expenseTrendScore =
        trends.expenseGrowth <= 0
          ? 10
          : Math.max(0, 10 - trends.expenseGrowth / 10);
      score += expenseTrendScore;
      maxScore += 10;
      factors.push({
        name: "Expense Trend",
        score: expenseTrendScore,
        maxScore: 10,
        value: `${trends.expenseGrowth.toFixed(1)}%`,
        description:
          trends.expenseGrowth <= 0
            ? "Decreasing expenses"
            : trends.expenseGrowth <= 10
            ? "Stable expenses"
            : "Rapidly increasing expenses",
      });

      // Normalize score to 0-100 if maxScore is not 100
      const normalizedScore = maxScore > 0 ? (score / maxScore) * 100 : 0;

      // Determine health status
      let healthStatus = "Poor";
      if (normalizedScore >= 80) healthStatus = "Excellent";
      else if (normalizedScore >= 70) healthStatus = "Very Good";
      else if (normalizedScore >= 60) healthStatus = "Good";
      else if (normalizedScore >= 50) healthStatus = "Fair";
      else if (normalizedScore >= 40) healthStatus = "Needs Attention";

      // Generate recommendations
      const recommendations = [];

      if (trends.savingsRate < 10) {
        recommendations.push(
          "Increase your savings rate to at least 10% of income"
        );
      }

      if (budgetAnalysis.averageUtilization > 100) {
        recommendations.push("Reduce spending to stay within your budget");
      }

      if (incomeStabilityScore < 10) {
        recommendations.push("Consider ways to stabilize your income sources");
      }

      if (expenseDistributionScore < 10) {
        recommendations.push("Diversify your spending across more categories");
      }

      if (trends.expenseGrowth > 10) {
        recommendations.push("Address the rapid growth in your expenses");
      }

      return {
        score: Math.round(normalizedScore),
        healthStatus,
        factors,
        recommendations,
        trends: {
          savingsRate: trends.savingsRate,
          incomeGrowth: trends.incomeGrowth,
          expenseGrowth: trends.expenseGrowth,
        },
      };
    } catch (error) {
      throw new Error(
        `Failed to calculate financial health score: ${error.message}`
      );
    }
  }

  /**
   * Get monthly comparison
   * @param {string} month1 - First month in format YYYY-MM
   * @param {string} month2 - Second month in format YYYY-MM
   * @returns {Promise<Object>} Comparison between two months
   */
  async compareMonths(month1, month2) {
    try {
      // Validate month format
      if (!/^\d{4}-\d{2}$/.test(month1) || !/^\d{4}-\d{2}$/.test(month2)) {
        throw new Error("Invalid month format. Expected YYYY-MM");
      }

      const userId = await this.#getUserId();

      // Get monthly statements using monthlyStatementService
      const [statement1, statement2] = await Promise.all([
        monthlyStatementService.getByUserIdAndYearMonth(userId, month1),
        monthlyStatementService.getByUserIdAndYearMonth(userId, month2),
      ]);

      if (!statement1 || !statement2) {
        throw new Error("One or both months have no data");
      }

      // Get category totals using categoryTotalService
      const [categoryTotals1Result, categoryTotals2Result] = await Promise.all([
        categoryTotalService.getAllByStatement(statement1.$id),
        categoryTotalService.getAllByStatement(statement2.$id),
      ]);

      const categoryTotals1Documents = categoryTotals1Result.documents;
      const categoryTotals2Documents = categoryTotals2Result.documents;

      // Get all unique category IDs
      const categoryIds = new Set([
        ...categoryTotals1Documents.map((ct) => ct.category_id),
        ...categoryTotals2Documents.map((ct) => ct.category_id),
      ]);

      // Get category details in batches if there are many
      const categoriesDocuments = await this.#processBatches(
        Array.from(categoryIds),
        async (batchCategoryIds) => {
          const categories = await categoryService.getByIds(batchCategoryIds);
          return categories.documents;
        },
        100 // Process 100 categories at a time
      );

      // Create a map for easy lookup
      const categoryMap = new Map(
        categoriesDocuments.flat().map((cat) => [cat.$id, cat])
      );

      // Create maps for easy lookup
      const totalsMap1 = new Map(
        categoryTotals1Documents.map((ct) => [ct.category_id, ct.amount])
      );
      const totalsMap2 = new Map(
        categoryTotals2Documents.map((ct) => [ct.category_id, ct.amount])
      );

      // Calculate category comparisons
      const categoryComparisons = Array.from(categoryIds).map((categoryId) => {
        const amount1 = totalsMap1.get(categoryId) || 0;
        const amount2 = totalsMap2.get(categoryId) || 0;
        const category = categoryMap.get(categoryId);

        return {
          id: categoryId,
          name: category?.name || "Unknown",
          icon: category?.icon,
          flow_type: category?.flow_type || "expense",
          amount1,
          amount2,
          difference: amount2 - amount1,
          percentageChange:
            amount1 > 0
              ? ((amount2 - amount1) / amount1) * 100
              : amount2 > 0
              ? 100
              : 0,
        };
      });

      // Sort by absolute difference (largest first)
      categoryComparisons.sort(
        (a, b) => Math.abs(b.difference) - Math.abs(a.difference)
      );

      // Calculate overall comparison
      const comparison = {
        month1: {
          yearMonth: month1,
          income: statement1.income,
          expense: statement1.expense,
          savings: statement1.income - statement1.expense,
          transactionCount: statement1.number_of_transactions,
        },
        month2: {
          yearMonth: month2,
          income: statement2.income,
          expense: statement2.expense,
          savings: statement2.income - statement2.expense,
          transactionCount: statement2.number_of_transactions,
        },
        differences: {
          income: statement2.income - statement1.income,
          expense: statement2.expense - statement1.expense,
          savings:
            statement2.income -
            statement2.expense -
            (statement1.income - statement1.expense),
          transactionCount:
            statement2.number_of_transactions -
            statement1.number_of_transactions,
        },
        percentageChanges: {
          income:
            statement1.income > 0
              ? ((statement2.income - statement1.income) / statement1.income) *
                100
              : 0,
          expense:
            statement1.expense > 0
              ? ((statement2.expense - statement1.expense) /
                  statement1.expense) *
                100
              : 0,
          savings:
            statement1.income - statement1.expense !== 0
              ? ((statement2.income -
                  statement2.expense -
                  (statement1.income - statement1.expense)) /
                  Math.abs(statement1.income - statement1.expense)) *
                100
              : 0,
        },
        categoryComparisons,
      };

      return comparison;
    } catch (error) {
      throw new Error(`Failed to compare months: ${error.message}`);
    }
  }
}

export const balanceAnalyticsService = new BalanceAnalyticsService();
export default balanceAnalyticsService;

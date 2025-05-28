import { Permission, Role, Query } from "appwrite";
import { BaseService } from "../../../lib/appwrite/base-service";
import { appwriteConfig } from "../../../lib/appwrite/config";
import { databases } from "../../../lib/appwrite/client";

/**
 * CRUD service for monthly statements
 */
class MonthlyStatementService extends BaseService {
  constructor() {
    super(appwriteConfig.collections.monthlyStatements, []);
    this.transactionsCollection = appwriteConfig.collections.transactions;
  }

  /**
   * Get monthly statement by user ID and year-month
   * @param {string} userId - User ID
   * @param {string} yearMonth - Year and month in format YYYY-MM
   * @returns {Promise<Object|null>} Monthly statement or null if not found
   */
  async getByUserIdAndYearMonth(userId, yearMonth) {
    try {
      const result = await this.listDocuments({ page: 0, pageSize: 1 }, [
        Query.equal("user_id", userId),
        Query.equal("year_month", yearMonth),
      ]);

      return result.total > 0 ? result.documents?.[0] : null;
    } catch (error) {
      throw new Error(`Failed to get monthly statement: ${error.message}`);
    }
  }

  /**
   * Create new monthly statement
   * @param {string} userId - User ID
   * @param {string} yearMonth - Year and month in format YYYY-MM
   * @param {Object} data - Monthly statement data
   * @returns {Promise<Object>} Created monthly statement
   */
  async create(userId, yearMonth, data = {}) {
    try {
      const defaultData = {
        user_id: userId,
        year_month: yearMonth,
        income: 0,
        expense: 0,
        budget_utilised: 0,
        recurring_expenses: 0,
        savings_amount: 0,
        number_of_transactions: 0,
        average_transaction_amount: 0,
        largest_transaction_amount: 0,
      };

      return await this.createDocument({ ...defaultData, ...data }, [
        Permission.read(Role.user(userId)),
        Permission.update(Role.user(userId)),
        Permission.delete(Role.user(userId)),
      ]);
    } catch (error) {
      throw new Error(`Failed to create monthly statement: ${error.message}`);
    }
  }

  /**
   * Update monthly statement
   * @param {string} documentId - Document ID
   * @param {Object} data - Data to update
   * @returns {Promise<Object>} Updated monthly statement
   */
  async update(documentId, data) {
    try {
      return await this.updateDocument(documentId, data);
    } catch (error) {
      throw new Error(`Failed to update monthly statement: ${error.message}`);
    }
  }

  /**
   * Get monthly statements for date range
   * @param {string} userId - User ID
   * @param {string} startYearMonth - Start year-month (YYYY-MM)
   * @param {string} endYearMonth - End year-month (YYYY-MM)
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Monthly statements
   */
  async getByDateRange(
    userId,
    startYearMonth,
    endYearMonth,
    options = { orderDesc: true }
  ) {
    try {
      const queries = [
        Query.equal("user_id", userId),
        Query.greaterThanEqual("year_month", startYearMonth),
        Query.lessThanEqual("year_month", endYearMonth),
      ];

      if (options.orderDesc) {
        queries.push(Query.orderDesc("year_month"));
      } else {
        queries.push(Query.orderAsc("year_month"));
      }

      return await this.listDocuments({ page: 0, pageSize: 100 }, queries);
    } catch (error) {
      throw new Error(
        `Failed to get monthly statements by date range: ${error.message}`
      );
    }
  }
  /**
   * Removes a transaction's effect from a monthly statement
   * @param {string} userId - User ID
   * @param {string} yearMonth - Year and month in format 'YYYY-MM'
   * @param {Object} transaction - Transaction object
   * @returns {Promise<Object>} - Updated monthly statement
   */
  async removeTransactionFromStatement(userId, yearMonth, transaction) {
    try {
      // Get the monthly statement
      const statement = await this.getByUserIdAndYearMonth(userId, yearMonth);

      if (!statement) {
        return null;
      }

      // Calculate the updated values
      const updatedValues = this.calculateRemovedTransactionEffect(
        statement,
        transaction
      );

      // Find largest transaction for the month after removal
      const { documents: transactions } = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.collections.transactions,
        [
          Query.equal("user_id", userId),
          Query.notEqual("$id", transaction.$id),
          Query.orderDesc("amount"),
          Query.limit(1),
        ]
      );

      // Update the largest transaction amount
      updatedValues.largest_transaction_amount =
        transactions.length > 0 ? transactions[0].amount : 0;

      // Update the statement
      return await this.update(statement.$id, updatedValues);
    } catch (error) {
      console.error("Error removing transaction from statement:", error);
      throw new Error("Failed to update monthly statement");
    }
  }

  /**
   * Adds a transaction's effect to a monthly statement
   * @param {string} userId - User ID
   * @param {string} yearMonth - Year and month in format 'YYYY-MM'
   * @param {Object} transaction - Transaction object
   * @returns {Promise<Object>} - Updated or created monthly statement
   */
  async addTransactionToStatement(userId, yearMonth, transaction) {
    try {
      // Get the monthly statement
      let statement = await this.getByUserIdAndYearMonth(userId, yearMonth);

      if (statement) {
        // Calculate the updated values
        const updatedValues = this.calculateAddedTransactionEffect(
          statement,
          transaction
        );

        // Update the statement
        return await this.update(statement.$id, updatedValues);
      } else {
        // Create new monthly statement
        return await this.create(userId, yearMonth, {
          income: transaction.flow_type === "income" ? transaction.amount : 0,
          expense: transaction.flow_type === "expense" ? transaction.amount : 0,
          budget_utilised:
            transaction.flow_type === "expense" ? transaction.amount : 0,
          number_of_transactions: 1,
          average_transaction_amount: transaction.amount,
          largest_transaction_amount: transaction.amount,
        });
      }
    } catch (error) {
      console.error("Error adding transaction to statement:", error);
      throw new Error("Failed to update monthly statement");
    }
  }

  /**
   * Updates a monthly statement when a transaction is modified
   * @param {string} userId - User ID
   * @param {string} yearMonth - Year and month in format 'YYYY-MM'
   * @param {Object} transaction - Original transaction object
   * @param {Object} changes - Changes to apply to the transaction
   * @returns {Promise<Object>} - Updated monthly statement
   */
  async updateStatementForTransactionChange(
    userId,
    yearMonth,
    transaction,
    changes
  ) {
    try {
      // Get the monthly statement
      const statement = await this.getByUserIdAndYearMonth(userId, yearMonth);

      if (!statement) {
        return null;
      }

      // Calculate the updated values
      const updatedValues = this.calculateTransactionChangeEffect(
        statement,
        transaction,
        changes
      );

      // Update the statement
      return await this.update(statement.$id, updatedValues);
    } catch (error) {
      console.error("Error updating statement for transaction change:", error);
      throw new Error("Failed to update monthly statement");
    }
  }

  /**
   * Calculates the effect of removing a transaction from a statement
   * @param {Object} statement - Monthly statement object
   * @param {Object} transaction - Transaction object
   * @returns {Object} - Updated statement values
   */
  calculateRemovedTransactionEffect(statement, transaction) {
    const {
      income,
      expense,
      number_of_transactions,
      average_transaction_amount,
      budget_utilised,
    } = statement;

    let newIncome = income;
    let newExpense = expense;
    let newBudgetUtilised = budget_utilised;

    // Remove transaction from statement totals
    if (transaction.flow_type === "income") {
      newIncome -= transaction.amount;
    } else if (transaction.flow_type === "expense") {
      newExpense -= transaction.amount;
      newBudgetUtilised -= transaction.amount;
    }

    // Calculate new average
    const newAverage =
      number_of_transactions > 1
        ? (average_transaction_amount * number_of_transactions -
            transaction.amount) /
          (number_of_transactions - 1)
        : 0;

    return {
      income: newIncome,
      expense: newExpense,
      number_of_transactions: number_of_transactions - 1,
      average_transaction_amount: newAverage,
      budget_utilised: newBudgetUtilised,
    };
  }

  /**
   * Calculates the effect of adding a transaction to a statement
   * @param {Object} statement - Monthly statement object
   * @param {Object} transaction - Transaction object
   * @returns {Object} - Updated statement values
   */
  calculateAddedTransactionEffect(statement, transaction) {
    const {
      income,
      expense,
      number_of_transactions,
      average_transaction_amount,
      largest_transaction_amount,
      budget_utilised,
    } = statement;

    // Calculate new values
    const newIncome =
      transaction.flow_type === "income" ? income + transaction.amount : income;

    const newExpense =
      transaction.flow_type === "expense"
        ? expense + transaction.amount
        : expense;

    const newNumberOfTransactions = number_of_transactions + 1;

    const newAverage =
      (average_transaction_amount * number_of_transactions +
        transaction.amount) /
      newNumberOfTransactions;

    const newLargestAmount = Math.max(
      largest_transaction_amount,
      transaction.amount
    );

    const newBudgetUtilised =
      transaction.flow_type === "expense"
        ? budget_utilised + transaction.amount
        : budget_utilised;

    return {
      income: newIncome,
      expense: newExpense,
      number_of_transactions: newNumberOfTransactions,
      average_transaction_amount: newAverage,
      largest_transaction_amount: newLargestAmount,
      budget_utilised: newBudgetUtilised,
    };
  }

  /**
   * Calculates the effect of changing a transaction on a statement
   * @param {Object} statement - Monthly statement object
   * @param {Object} transaction - Original transaction object
   * @param {Object} changes - Changes to apply to the transaction
   * @returns {Object} - Updated statement values
   */
  calculateTransactionChangeEffect(statement, transaction, changes) {
    const {
      income,
      expense,
      number_of_transactions,
      average_transaction_amount,
      budget_utilised,
    } = statement;

    let newIncome = income;
    let newExpense = expense;
    let newBudgetUtilised = budget_utilised;

    // Handle flow type changes
    if (changes?.flow_type) {
      const newAmount =
        changes.amount !== undefined ? changes.amount : transaction.amount;

      if (
        transaction.flow_type === "income" &&
        changes.flow_type === "expense"
      ) {
        // Changed from income to expense
        newIncome -= transaction.amount;
        newExpense += newAmount;
        newBudgetUtilised += newAmount;
      } else if (
        transaction.flow_type === "expense" &&
        changes.flow_type === "income"
      ) {
        // Changed from expense to income
        newExpense -= transaction.amount;
        newIncome += newAmount;
        newBudgetUtilised -= transaction.amount;
      } else if (changes.amount !== undefined) {
        // Same flow type but amount changed
        const difference = newAmount - transaction.amount;

        if (transaction.flow_type === "income") {
          newIncome += difference;
        } else {
          newExpense += difference;
          newBudgetUtilised += difference;
        }
      }
    } else if (changes?.amount !== undefined) {
      // Only amount changed, not flow type
      const difference = changes.amount - transaction.amount;

      if (transaction.flow_type === "income") {
        newIncome += difference;
      } else {
        newExpense += difference;
        newBudgetUtilised += difference;
      }
    }

    // Calculate new average transaction amount
    const totalTransactionValue =
      average_transaction_amount * number_of_transactions;
    let newTotalValue = totalTransactionValue;

    if (changes?.amount !== undefined) {
      newTotalValue =
        totalTransactionValue - transaction.amount + changes.amount;
    }

    const newAverage = newTotalValue / number_of_transactions;

    return {
      income: newIncome,
      expense: newExpense,
      average_transaction_amount: newAverage,
      number_of_transactions: number_of_transactions,
      budget_utilised: newBudgetUtilised,
    };
  }
}

export const monthlyStatementService = new MonthlyStatementService();
export default monthlyStatementService;

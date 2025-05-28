import { format } from "date-fns";
import accountSummaryService from "./account-summary.service";
import monthlyStatementService from "./monthly-statement.service";
import categoryService from "../../../lib/services/category.service";
import categoryTotalService from "./category-total.service";
import { account } from "../../../lib/appwrite/client";

/**
 * Service for balance operations that coordinates between CRUD services
 */
class BalanceOperationsService {
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
   * Validate amount
   * @private
   * @param {number} amount - Amount to validate
   * @throws {Error} If amount is invalid
   */
  #validateAmount(amount) {
    if (typeof amount !== "number" || isNaN(amount) || amount <= 0) {
      throw new Error("Amount must be a positive number");
    }
  }

  /**
   * Validate flow type
   * @private
   * @param {string} flowType - Flow type to validate
   * @throws {Error} If flow type is invalid
   */
  #validateFlowType(flowType) {
    if (flowType !== "income" && flowType !== "expense") {
      throw new Error("Flow type must be 'income' or 'expense'");
    }
  }

  /**
   * Validate date
   * @private
   * @param {string|Date} date - Date to validate
   * @throws {Error} If date is invalid
   */
  #validateDate(date) {
    if (!date || isNaN(new Date(date).getTime())) {
      throw new Error("Invalid date provided");
    }
  }

  /**
   * Get or initialize user balance
   * @returns {Promise<Object>} User balance
   */
  async getUserBalance() {
    try {
      const userId = await this.#getUserId();
      let userBalance = await accountSummaryService.getByUserId(userId);

      if (!userBalance) {
        userBalance = await accountSummaryService.create(userId);
      }

      return userBalance;
    } catch (error) {
      throw new Error(`Failed to get user balance: ${error.message}`);
    }
  }

  /**
   * Get or create monthly statement
   * @param {string|Date} date - Date
   * @returns {Promise<Object>} Monthly statement
   */
  async getMonthlyStatement(date) {
    try {
      this.#validateDate(date);
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
      throw new Error(`Failed to get monthly statement: ${error.message}`);
    }
  }

  /**
   * Update balances for a transaction
   * @param {number} amount - Transaction amount
   * @param {string} flowType - Transaction type (income/expense)
   * @param {string|Date} date - Transaction date
   * @param {string|null} categoryId - Category ID
   * @returns {Promise<Object>} Updated balances
   */
  async updateBalances(amount, flowType, date, categoryId = null) {
    try {
      // Validate inputs
      this.#validateAmount(amount);
      this.#validateFlowType(flowType);
      this.#validateDate(date);

      const userId = await this.#getUserId();

      // Get required data
      const balancesPromises = [
        this.getUserBalance(),
        this.getMonthlyStatement(date),
      ];

      if (categoryId) {
        balancesPromises.push(categoryService.getCategory(categoryId));
      }

      const [userBalance, monthlyStatement] = await Promise.all(
        balancesPromises
      );

      // Update account summary
      const updatedUserBalance = await accountSummaryService.update(
        userBalance.$id,
        {
          total_income:
            flowType === "income"
              ? userBalance.total_income + amount
              : userBalance.total_income,
          total_expenses:
            flowType === "expense"
              ? userBalance.total_expenses + amount
              : userBalance.total_expenses,
          current_balance:
            flowType === "income"
              ? userBalance.current_balance + amount
              : userBalance.current_balance - amount,
          last_transaction_date: new Date().toISOString(),
        }
      );

      // Update monthly statement
      const updatedMonthlyStatement = await monthlyStatementService.update(
        monthlyStatement.$id,
        {
          income:
            flowType === "income"
              ? monthlyStatement.income + amount
              : monthlyStatement.income,
          expense:
            flowType === "expense"
              ? monthlyStatement.expense + amount
              : monthlyStatement.expense,
          number_of_transactions: monthlyStatement.number_of_transactions + 1,
          average_transaction_amount:
            (monthlyStatement.average_transaction_amount *
              monthlyStatement.number_of_transactions +
              amount) /
            (monthlyStatement.number_of_transactions + 1),
          largest_transaction_amount: Math.max(
            monthlyStatement.largest_transaction_amount,
            amount
          ),
          budget_utilised:
            flowType === "expense"
              ? monthlyStatement.budget_utilised + amount
              : monthlyStatement.budget_utilised,
        }
      );

      // Update category total if category provided
      if (categoryId) {
        const categoryTotal =
          await categoryTotalService.getByStatementAndCategory(
            monthlyStatement.$id,
            categoryId
          );

        if (categoryTotal) {
          await categoryTotalService.update(categoryTotal.$id, {
            amount: categoryTotal.amount + amount,
          });
        } else {
          await categoryTotalService.create(
            userId,
            monthlyStatement.$id,
            categoryId,
            amount
          );
        }
      }

      return {
        userBalance: updatedUserBalance,
        monthlyStatement: updatedMonthlyStatement,
      };
    } catch (error) {
      console.log("Error updating balances: ", error);
      throw new Error(`Failed to update balances: ${error.message}`);
    }
  }

  /**
   * Revert balance updates
   * @param {number} amount - Transaction amount
   * @param {string} flowType - Transaction type (income/expense)
   * @param {string|Date} date - Transaction date
   * @param {string|null} categoryId - Category ID
   * @returns {Promise<Object>} Updated balances
   */
  async revertBalanceUpdate(amount, flowType, date, categoryId = null) {
    try {
      // Validate inputs
      this.#validateAmount(amount);
      this.#validateFlowType(flowType);
      this.#validateDate(date);

      // Get required data
      const balancesPromises = [
        this.getUserBalance(),
        this.getMonthlyStatement(date),
      ];

      const [userBalance, monthlyStatement] = await Promise.all(
        balancesPromises
      );

      // Update account summary (reverse)
      const updatedUserBalance = await accountSummaryService.update(
        userBalance.$id,
        {
          total_income:
            flowType === "income"
              ? userBalance.total_income - amount
              : userBalance.total_income,
          total_expenses:
            flowType === "expense"
              ? userBalance.total_expenses - amount
              : userBalance.total_expenses,
          current_balance:
            flowType === "income"
              ? userBalance.current_balance - amount
              : userBalance.current_balance + amount,
        }
      );

      // Update monthly statement (reverse)
      const updatedMonthlyStatement = await monthlyStatementService.update(
        monthlyStatement.$id,
        {
          income:
            flowType === "income"
              ? monthlyStatement.income - amount
              : monthlyStatement.income,
          expense:
            flowType === "expense"
              ? monthlyStatement.expense - amount
              : monthlyStatement.expense,
          number_of_transactions: Math.max(
            0,
            monthlyStatement.number_of_transactions - 1
          ),
          average_transaction_amount:
            monthlyStatement.number_of_transactions > 1
              ? (monthlyStatement.average_transaction_amount *
                  monthlyStatement.number_of_transactions -
                  amount) /
                (monthlyStatement.number_of_transactions - 1)
              : 0,
          budget_utilised:
            flowType === "expense"
              ? monthlyStatement.budget_utilised - amount
              : monthlyStatement.budget_utilised,
        }
      );

      // Update category total if category provided (reverse)
      if (categoryId) {
        const categoryTotal =
          await categoryTotalService.getByStatementAndCategory(
            monthlyStatement.$id,
            categoryId
          );

        if (categoryTotal) {
          const newAmount = categoryTotal.amount - amount;

          if (newAmount <= 0) {
            await categoryTotalService.delete(categoryTotal.$id);
          } else {
            await categoryTotalService.update(categoryTotal.$id, {
              amount: newAmount,
            });
          }
        }
      }

      return {
        userBalance: updatedUserBalance,
        monthlyStatement: updatedMonthlyStatement,
      };
    } catch (error) {
      throw new Error(`Failed to revert balance update: ${error.message}`);
    }
  }
}

export const balanceOperationsService = new BalanceOperationsService();
export default balanceOperationsService;

import { balancesService } from "../../balances/services";
import { transactionService } from "../services/transaction.service";
import { monthlyStatementService } from "../../balances/services/monthly-statement.service";
import { format } from "date-fns";
import { account } from "../../../lib/appwrite/client";

export const createTransactionAction = async ({ request }) => {
  const payload = await request.json();
  try {
    const balances = await balancesService.updateBalances(
      parseFloat(payload.amount),
      payload.flow_type,
      payload.date,
      payload.category
    );

    if (balances) {
      try {
        const transaction = await transactionService.createTransaction(payload);
        console.log("New transaction Transaction: ", transaction);
        if (transaction) {
          return {
            success: true,
            message: "Transaction created successfully",
          };
        } else {
          await balancesService.revertBalanceUpdate(
            parseFloat(payload.amount),
            payload.flow_type,
            payload.date,
            payload.category
          );
          return {
            error: true,
            message:
              "Failed to create transaction record. Changes have been reverted.",
          };
        }
      } catch (transactionError) {
        await balancesService.revertBalanceUpdate(
          parseFloat(payload.amount),
          payload.flow_type,
          payload.date,
          payload.category
        );

        console.log("Transaction creation error: ", transactionError);
        return {
          error: true,
          message: "Failed to create transaction. Changes have been reverted.",
          details:
            transactionError?.response?.message || transactionError?.message,
        };
      }
    }
    return {
      error: true,
      message: "Failed to update balances.",
    };
  } catch (error) {
    return {
      error: true,
      message: error.message || "Failed to create transaction",
    };
  }
};

export const updateTransactionAction = async ({ request, params }) => {
  try {
    const payload = await request.json();
    const transaction = await transactionService.getTransaction(params.id);

    if (!transaction) {
      return {
        error: true,
        message: "Transaction not found",
      };
    }

    // Calculate changes between payload and existing transaction
    const changes = getChanges(payload, transaction);

    if (!changes || Object.keys(changes).length === 0) {
      return {
        success: true,
        message: "No changes to update",
        transaction: transaction,
      };
    }

    // Get current user
    const { $id: userId } = await account.get();

    // Handle monthly statement updates if date, amount, or flow_type changed
    if (changes.date || changes.amount || changes.flow_type) {
      await updateMonthlyStatements(transaction, changes, userId);
    }

    // Update the transaction
    const updatedTransaction = await transactionService.updateTransaction(
      params.id,
      changes
    );

    return {
      success: true,
      transaction: updatedTransaction,
      message: "Transaction updated successfully",
    };
  } catch (error) {
    console.error("Error updating transaction:", error);
    return {
      error: true,
      message: error.message || "Failed to update transaction",
    };
  }
};

const getChanges = (formValues, transaction) => {
  const changes = {};
  for (const key in formValues) {
    if (key === "category") {
      if (transaction?.category && formValues[key] !== transaction[key]?.$id) {
        changes[key] = formValues[key];
      } else if (transaction[key] === null && formValues[key]) {
        changes[key] = formValues[key];
      }
      continue;
    } else if (key === "payer_payee") {
      if (
        transaction?.payer_payee &&
        formValues[key] !== transaction[key]?.$id
      ) {
        changes[key] = formValues[key];
      } else if (transaction[key] === null && formValues[key]) {
        changes[key] = formValues[key];
      }
      continue;
    } else if (key === "date") {
      const formattedTransactionDate = format(
        new Date(transaction[key]),
        "yyyy-MM-dd"
      );
      if (formValues[key] !== formattedTransactionDate) {
        changes[key] = formValues[key];
      }
      continue;
    } else if (key === "$permissions" || key === "invoice_ref") {
      continue;
    } else if (formValues[key] !== transaction[key]) {
      changes[key] = formValues[key];
    }
  }
  return Object.keys(changes).length > 0 ? changes : null;
};

// Update monthly statements based on transaction changes
const updateMonthlyStatements = async (transaction, changes, userId) => {
  // Check if date has changed to a different month
  if (changes.date) {
    const prevMonth = format(new Date(transaction.date), "MM");
    const newMonth = format(new Date(changes.date), "MM");

    if (prevMonth !== newMonth) {
      // If month changed, handle both months
      const prevYearMonth = format(new Date(transaction.date), "yyyy-MM");
      const newYearMonth = format(new Date(changes.date), "yyyy-MM");

      // 1. Remove transaction from previous month
      await monthlyStatementService.removeTransactionFromStatement(
        userId,
        prevYearMonth,
        transaction
      );

      // 2. Add modified transaction to new month
      const modifiedTransaction = {
        ...transaction,
        amount:
          changes.amount !== undefined ? changes.amount : transaction.amount,
        flow_type: changes.flow_type || transaction.flow_type,
        date: changes.date,
      };

      await monthlyStatementService.addTransactionToStatement(
        userId,
        newYearMonth,
        modifiedTransaction
      );
    } else if (changes.amount || changes.flow_type) {
      // If month didn't change but amount or flow_type did
      const yearMonth = format(new Date(transaction.date), "yyyy-MM");

      await monthlyStatementService.updateStatementForTransactionChange(
        userId,
        yearMonth,
        transaction,
        changes
      );
    }
  } else if (changes.amount || changes.flow_type) {
    // If only amount or flow_type changed (not date)
    const yearMonth = format(new Date(transaction.date), "yyyy-MM");

    await monthlyStatementService.updateStatementForTransactionChange(
      userId,
      yearMonth,
      transaction,
      changes
    );
  }
};

export const deleteTransactionAction = async ({ params }) => {
  try {
    const transaction = await transactionService.getTransaction(params.id);

    if (!transaction) {
      return {
        error: true,
        message: "Transaction not found",
      };
    }

    await balancesService.revertBalanceUpdate(
      parseFloat(transaction.amount),
      transaction.flow_type,
      transaction.date,
      transaction.category?.$id
    );

    // Delete the transaction
    await transactionService.deleteTransaction(params.id);

    return {
      success: true,
      message: "Transaction deleted successfully",
    };
  } catch (error) {
    return {
      error: true,
      message: error.message || "Failed to delete transaction",
    };
  }
};

import { Book } from "../../../components/common/icons";
import EmptyState from "../../../components/common/EmptyState";
import PropTypes from "prop-types";

export default function TransactionsEmptyState({ toggleCreate }) {
  return (
    <EmptyState
      icon={Book}
      title="No Transactions"
      description="You haven't created any transaction yet."
      actionLabel="Create Transaction"
      onAction={toggleCreate}
    />
  );
}

TransactionsEmptyState.propTypes = {
  toggleCreate: PropTypes.func.isRequired,
};

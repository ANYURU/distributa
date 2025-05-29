import { FileText } from "../../../components/common/icons";
import EmptyState from "../../../components/common/EmptyState";
import { useInvoices } from "../hooks";

export default function InvoiceEmptyState() {
  const { navigateToCreate } = useInvoices();

  return (
    <EmptyState
      icon={FileText}
      title="No invoices found"
      description="Create a new invoice to get started"
      actionLabel="Create invoice"
      onAction={navigateToCreate}
    />
  );
}

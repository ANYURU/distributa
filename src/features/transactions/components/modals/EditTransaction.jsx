import { CircleX } from "../../../../components/common/icons";
import { createPortal } from "react-dom";
import { useTransactionView } from "../../hooks";
import { format } from "date-fns";
import TransactionForm from "../../../../components/Forms/TransactionForm";

const EditTransaction = ({ transaction, handleClose }) => {
  const handleSubmit = async (values) => {
    values.amount = parseFloat(values.amount);
    updateDetails(values);
  };

  const initialData = {
    ...transaction,
    payer_payee: transaction?.payer_payee?.$id ?? null,
    category: transaction?.category?.$id ?? null,
    date: format(new Date(transaction.date), "yyyy-MM-dd"),
  };

  const {
    actions: { updateDetails },
    isSubmitting,
  } = useTransactionView(transaction, handleClose);

  return createPortal(
    <main className="fixed top-0 left-0 bg-black bg-opacity-10 h-screen w-screen flex justify-center items-end lg:items-center z-[70]">
      <section className="w-96 lg:w-[36rem] h-fit max-h-full overflow-y-auto flex flex-col bg-white relative z-50">
        <header className="flex justify-between w-full bg-grey p-4">
          <h5 className="font-archivo font-normal text-small leading-150 tracking-normal">
            Edit Current Transaction
          </h5>
          <button type="button" onClick={handleClose}>
            <CircleX variation="black" className="w-4 h-4" />
          </button>
        </header>
        <TransactionForm
          initialData={initialData}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </section>
    </main>,
    document.getElementById("portal")
  );
};

export default EditTransaction;

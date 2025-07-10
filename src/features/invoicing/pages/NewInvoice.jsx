import { useCreateInvoice } from "../hooks/useCreateInvoice";
import InvoiceForm from "../components/InvoiceForm";
import { newInvoiceSchema } from "../../../utils/validators";
import { ContentViewAreaWrapper } from "../../../Layouts/components";
import { formatInvoiceData } from "../utils/formatInvoiceData";
import { Suspense } from "react";

export const NewInvoicePage = () => {
  const { organisation, invoices, isLoading, actions } = useCreateInvoice();

  const handleSubmit = (values) => {
    const formattedValues = formatInvoiceData(values);
    actions.createInvoice(formattedValues);
  };

  return (
    <ContentViewAreaWrapper>
      <section className="flex h-fit flex-shrink-0 flex-col gap-y-2">
        <header className="flex flex-col gap-y-2">
          <h1 className="font-archivo font-normal text-xl lg:text-4xl leading-110 tracking-normal">
            New Invoice
          </h1>
        </header>
        <hr className="invisible h-8" />
      </section>
      <main className="flex w-full flex-col h-fit gap-y-4 lg:pt-6">
        <Suspense fallback={<div>Loading...</div>}>
          <InvoiceForm
            organisationPromise={organisation}
            invoicesPromise={invoices}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            submitButtonText="Create Invoice"
            validationSchema={newInvoiceSchema}
            mode="create"
          />
        </Suspense>
      </main>
    </ContentViewAreaWrapper>
  );
};

import { use } from "react";
import {
  Pagination,
  PageSizeSelector,
} from "../../../../components/common/pagination";

function Footer({ transactionsPromise, paginationControls }) {
  const transactions = use(transactionsPromise);

  const totalPages = Math.max(
    1,
    Math.ceil(transactions.total / paginationControls.pageSize)
  );

  const pagination = {
    ...paginationControls,
    totalPages: totalPages,
    hasNextPage: paginationControls.currentPage < totalPages - 1,
    hasPreviousPage: paginationControls.currentPage > 0,
  };

  return (
    <div className="w-full flex flex-wrap items-center justify-between mt-4 gap-4">
      <PageSizeSelector
        pageSize={pagination.pageSize}
        onPageSizeChange={pagination.onPageSizeChange}
        pageSizeOptions={[10, 25, 50, 100]}
        currentPage={pagination.currentPage}
        totalItems={transactions.total}
      />
      <Pagination {...pagination} />
    </div>
  );
}

export default Footer;

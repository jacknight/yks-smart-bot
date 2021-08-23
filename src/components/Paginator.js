import React from "react";
import ReactPaginate from "react-paginate";

const Paginator = ({ pageCount, onPageChange, initialPage }) => {
  return (
    <ReactPaginate
      initialPage={initialPage}
      disableInitialCallback={true}
      previousLabel={"<"}
      nextLabel={">"}
      breakLabel={"..."}
      marginPagesDisplayed={2}
      pageRangeDisplayed={2}
      containerClassName={"paginator"}
      pageCount={pageCount}
      onPageChange={onPageChange}
    />
  );
};

export default Paginator;

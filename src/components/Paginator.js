import React from "react";
import ReactPaginate from "react-paginate";

const Paginator = ({ pageCount, onPageChange }) => {
  return (
    <ReactPaginate
      previousLabel={"previous"}
      nextLabel={"next"}
      breakLabel={"..."}
      marginPagesDisplayed={2}
      pageRangeDisplayed={5}
      containerClassName={"paginator"}
      pageCount={pageCount}
      onPageChange={onPageChange}
    />
  );
};

export default Paginator;

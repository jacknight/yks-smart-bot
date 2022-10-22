import React from 'react';
import ReactPaginate from 'react-paginate';

const Paginator = ({ pageCount, onPageChange, initialPage, forcePage }) => {
  return (
    <ReactPaginate
      initialPage={initialPage}
      forcePage={forcePage}
      disableInitialCallback={true}
      previousLabel={'<'}
      nextLabel={'>'}
      breakLabel={'...'}
      marginPagesDisplayed={1}
      pageRangeDisplayed={2}
      containerClassName={'paginator'}
      pageLinkClassName={'paginatorLink'}
      previousLinkClassName={'paginatorLink'}
      nextLinkClassName={'paginatorLink'}
      breakLinkClassName={'paginatorLink'}
      activeLinkClassName={'paginatorActiveLink'}
      pageCount={pageCount}
      onPageChange={onPageChange}
    />
  );
};

export default Paginator;

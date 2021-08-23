import { uniqueId } from "lodash";
import React, { useEffect, useState } from "react";
import Paginator from "./Paginator";
import { useParams, useHistory } from "react-router-dom";

const fetchClipUrls = (pageNumber, clipsPerPage) => {
  return fetch(
    `${process.env.REACT_APP_HOST}/api/clips/${pageNumber}?=${clipsPerPage}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  )
    .then((data) => data.json())
    .catch((err) => console.error(err));
};

const Clips = (props) => {
  const params = useParams();
  const history = useHistory();
  const [pageCount, setPageCount] = useState(0);
  const [currPage, setCurrPage] = useState(Number(params.page) || 1);
  const [currClips, setCurrClips] = useState(null);
  const clipsPerPage = 1;

  const requestClips = (pageNumber) => {
    fetchClipUrls(pageNumber, clipsPerPage).then((data) => {
      if (data && data.clips && data.totalClips && data.page) {
        setPageCount(Math.ceil(data.totalClips / clipsPerPage));
        setCurrClips(data.clips);
        setCurrPage(data.page);
      }
    });
  };

  const handlePageChange = async (data) => {
    history.push(`/clips/${data.selected + 1}`);
    requestClips(data.selected + 1);
  };

  if (!currClips) {
    requestClips(currPage);
  }

  return (
    <>
      <button
        onClick={() => {
          const randomPage = Math.ceil(Math.random() * pageCount);
          history.push(`/clips/${randomPage}`);
          requestClips(randomPage);
        }}
      >
        Random Clip
      </button>
      <Paginator
        initialPage={currPage - 1}
        pageCount={pageCount}
        onPageChange={handlePageChange}
      />
      <div className='main clips'>
        {currClips?.map((url, index) => {
          return (
            <video className='clip' controls key={uniqueId()}>
              <source src={url} />
            </video>
          );
        })}
      </div>
    </>
  );
};

export default Clips;

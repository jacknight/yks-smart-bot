import { uniqueId } from "lodash";
import React, { useEffect, useState } from "react";
import Paginator from "./Paginator";
import { useParams, useHistory } from "react-router-dom";
import queryString from "query-string";

const fetchClipUrls = (pageNumber, data) => {
  let params = queryString.stringify(data);
  return fetch(
    `${process.env.REACT_APP_HOST}/api/clips/${pageNumber}?${params}`,
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

const Clips = ({ session, clearSession }) => {
  const params = useParams();
  let history = useHistory();
  const [pageCount, setPageCount] = useState(0);
  const [currPage, setCurrPage] = useState(Number(params.page) || 1);
  const [currClips, setCurrClips] = useState(null);
  const clipsPerPage = 1;

  useEffect(() => {
    history.replace(`/clips/${currPage}`);
    requestClips(currPage);
  }, [currPage]);

  const requestClips = (pageNumber) => {
    fetchClipUrls(pageNumber, { clipsPerPage, session }).then((data) => {
      if (data && data.clips && data.totalClips && data.page) {
        setCurrClips(data.clips);
        setPageCount(Math.ceil(data.totalClips / clipsPerPage));
      } else {
        history.push("/");
        clearSession();
      }
    });
  };

  const handlePageChange = async (data) => {
    setCurrPage(data.selected + 1);
  };

  if (!currClips) {
    requestClips(currPage);
  }

  return (
    <>
      <button
        className={"randomClipButton"}
        onClick={() => {
          const randomPage = Math.ceil(Math.random() * pageCount);
          setCurrPage(randomPage);
        }}
      >
        Random Clip
      </button>
      <Paginator
        initialPage={currPage - 1}
        forcePage={currPage - 1}
        pageCount={pageCount}
        onPageChange={handlePageChange}
      />
      <div className='main clips'>
        {currClips?.map((url) => {
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

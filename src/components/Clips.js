import { uniqueId } from "lodash";
import React, { useEffect, useState } from "react";
import Paginator from "./Paginator";

const fetchClipUrls = () => {
  return fetch(`http://localhost:3000/api/clips`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((data) => data.json())
    .catch((err) => console.error(err));
};

const Clips = (props) => {
  const [clipUrls, setClipUrls] = useState(null);
  const [currClips, setCurrClips] = useState([]);
  const [pageCount, setPageCount] = useState(0);
  const [currPage, setCurrPage] = useState(0);
  const clipsPerPage = 1;

  const handlePageChange = (data) => {
    const offset = data.selected * clipsPerPage;
    let clips = [...clipUrls];
    clips = clips.slice(offset, offset + clipsPerPage);
    setCurrPage(data.selected);
    setCurrClips(clips);
  };

  if (!clipUrls) {
    const res = fetchClipUrls();

    res.then((data) => {
      if (data) {
        // data.clips.sort(() => {
        //   return Math.floor(Math.random() * 3) - 1;
        // });
        setPageCount(Math.ceil(data.clips.length / clipsPerPage));
        setClipUrls(data.clips);
        const offset = currPage * clipsPerPage;
        let clips = [...data.clips];
        clips = clips.slice(offset, offset + clipsPerPage);
        setCurrClips(clips);
      }
    });
  }

  return (
    <>
      <Paginator pageCount={pageCount} onPageChange={handlePageChange} />
      <div className='main clips'>
        {currClips?.map((url, index) => {
          return (
            <video className='clip' controls key={uniqueId()}>
              <source src={url} />
            </video>
          );
        })}
      </div>
      <Paginator pageCount={pageCount} onPageChange={handlePageChange} />
    </>
  );
};

export default Clips;

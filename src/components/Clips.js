import { uniqueId } from 'lodash';
import React, { useEffect, useState } from 'react';
import Paginator from './Paginator';
import { useParams, useNavigate } from 'react-router-dom';
import queryString from 'query-string';
import fetch from 'node-fetch';

const Clips = ({ session, clearSession }) => {
  const params = useParams();
  let navigate = useNavigate();
  const [pageCount, setPageCount] = useState(0);
  const [currPage, setCurrPage] = useState(Number(params.page) || 1);
  const [currClips, setCurrClips] = useState(null);
  const clipsPerPage = 1;

  useEffect(() => {
    navigate(`/clips/${currPage}`, { replace: true });
    requestClips(currPage);
  }, [currPage]);

  const requestClips = (pageNumber) => {
    fetchClipUrls(pageNumber, { clipsPerPage, session }).then((data) => {
      if (data && data.clips && data.totalClips && data.page) {
        setCurrClips(data.clips);
        setPageCount(Math.ceil(data.totalClips / clipsPerPage));
      } else {
        navigate('/');
        clearSession();
      }
    });
  };

  const fetchClipUrls = (pageNumber, data) => {
    let params = queryString.stringify(data);
    return fetch(`/api/clips/${pageNumber}?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((data) => data.json())
      .catch((err) => console.error(err));
  };

  const handlePageChange = async (data) => {
    setCurrPage(data.selected + 1);
  };

  const shareClip = async () => {
    let data = {
      clip: currPage - 1,
      session,
    };
    return fetch(`/api/share-clip`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  };

  if (!currClips) {
    requestClips(currPage);
  }

  return (
    <>
      <button
        className={'clipButton'}
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
      <div className="main clips">
        {currClips?.map((url) => {
          return (
            <video
              className="clip"
              controls
              key={uniqueId()}
              src={url}
              autoPlay
              onError={(e) => {
                console.log(e);
                e.target.onerror = null;
                e.target.src = `${process.env.PUBLIC_URL}/assets/error.mp3`;
              }}
            />
          );
        })}
      </div>

      <button className={'clipButton'} onClick={shareClip}>
        Share On The Pisscord
      </button>
    </>
  );
};

export default Clips;

import React, { useEffect, useState } from "react";
import queryString from "query-string";
import fetch from "node-fetch";

const createSession = (code, fetchSignal) => {
  return fetch(`${process.env.REACT_APP_HOST}/api/login`, {
    method: "POST",
    signal: fetchSignal,
    headers: {
      "Content-Type": "application/json",
    },
    body: `{ "code": "${code}" }`,
  })
    .then((data) => data.json())
    .catch((err) => console.error(err));
};

const Login = ({ setSession, setUser }) => {
  const [code, setCode] = useState(null);
  var fetchController = new AbortController();
  var fetchSignal = fetchController.signal;

  useEffect(async () => {
    if (code) {
      const res = await createSession(code, fetchSignal);
      console.log(res);
      if (res && res.user && res.sessionId) {
        setSession(res.sessionId);
        setUser(res.user);
      }
    }
    return () => fetchController.abort();
  });

  if (!code) {
    const search = { location }.location?.search;
    const params = search ? queryString.parse(search) : null;
    if (params?.code) {
      setCode(params.code);
    }

    return (
      <main>
        <a href={process.env.REACT_APP_DISCORD_LOGIN_LINK}>Login</a>
      </main>
    );
  } else {
    return (
      <main>
        <h1>Working......</h1>
      </main>
    );
  }
};

export default Login;

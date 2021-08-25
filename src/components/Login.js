import React, { useEffect, useState } from "react";
import queryString from "query-string";
import fetch from "node-fetch";
import { useHistory } from "react-router-dom";

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

const Login = ({ setSession, setUser, clearSession }) => {
  const [code, setCode] = useState(null);
  const history = useHistory();
  const fetchController = new AbortController();
  const fetchSignal = fetchController.signal;

  useEffect(async () => {
    if (code) {
      const res = await createSession(code, fetchSignal);
      if (res && res.user && res.session) {
        setUser(res.user);
        setSession(res.session);
      } else {
        setUser(null);
        clearSession();
      }
    }
    return () => fetchController.abort();
  }, [code]);

  if (!code) {
    const search = history.location.search;
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
    history.push("/");
    return (
      <main>
        <h1>Working......</h1>
      </main>
    );
  }
};

export default Login;

import { useState } from "react";

const useSession = () => {
  const getSession = () => {
    return localStorage.getItem("session");
  };

  const [session, setSession] = useState(getSession());

  const saveSession = (session) => {
    localStorage.setItem("session", session);
    setSession(session);
  };

  return {
    setSession: saveSession,
    session,
  };
};

export default useSession;

import { useState } from 'react';

const useSession = () => {
  const clearSession = () => {
    localStorage.removeItem('session');
    setSession(null);
  };

  const getSession = () => {
    return localStorage.getItem('session');
  };

  const [session, setSession] = useState(getSession());

  const saveSession = (session) => {
    localStorage.setItem('session', session);
    setSession(session);
  };

  return {
    clearSession,
    setSession: saveSession,
    session,
  };
};

export default useSession;

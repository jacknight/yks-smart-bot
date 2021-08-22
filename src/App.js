import React, { useEffect, useState } from "react";
import Header from "./components/Header";
import Login from "./components/Login";
import Nav from "./components/Nav";
import NavLink from "./components/NavLink";
import Title from "./components/Title";
import Main from "./components/Main";
import Footer from "./components/Footer";
import Clips from "./components/Clips";
import Episodes from "./components/Episodes";
import RealOrFake from "./components/RealOrFake";
import Mailbag from "./components/Mailbag";
import Buzzer from "./components/Buzzer";
import { BrowserRouter, Route, Switch, useLocation } from "react-router-dom";
import queryString from "query-string";

const App = (props) => {
  const [session, setSession] = useState();
  const [user, setUser] = useState();

  if (!session || !user) {
    return <Login setSession={setSession} setUser={setUser} />;
  } else {
    return (
      <BrowserRouter>
        <div className='App'>
          <Header>
            <Title>YKS Smart Bot Mainframe</Title>
            <NavLink id='header-logout' href=''>
              Logout
            </NavLink>
          </Header>
          <Nav>
            <NavLink id='nav-episodes' href='episodes'>
              Episodes
            </NavLink>
            <NavLink id='nav-clips' href='clips'>
              Clips
            </NavLink>
            <NavLink id='nav-realorfake' href='real-or-fake'>
              Real or Fake?
            </NavLink>
            <NavLink id='nav-mailbag' href='mailbag'>
              Mailbag
            </NavLink>
            <NavLink id='nav-buzzer' href='buzzer'>
              Buzzer
            </NavLink>
          </Nav>
          <Main>
            <Switch>
              <Route path='/episodes'>
                <Title>Episodes</Title>
                <Episodes />
              </Route>
              <Route path='/clips'>
                <Title>Clips</Title>
                <Clips user={user} sessionId={session} />
              </Route>
              <Route path='/real-or-fake'>
                <Title>Real or Fake</Title>
                <RealOrFake />
              </Route>
              <Route path='/mailbag'>
                <Title>Mailbag</Title>
                <Mailbag />
              </Route>
              <Route path='/buzzer'>
                <Title>Buzzer</Title>
                <Buzzer />
              </Route>
            </Switch>
          </Main>
          <Footer></Footer>
        </div>
      </BrowserRouter>
    );
  }
};

export default App;

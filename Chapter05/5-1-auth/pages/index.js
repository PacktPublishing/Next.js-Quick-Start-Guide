import React from "react";
import {login, logout, me, makeStore} from "../lib/redux";
import withRedux from "next-redux-wrapper";

const Index = ({login, logout, me, user, error}) => (
    <div>
        {error && (<div>Login error: {error}</div>)}
        {(!!user ? (
            <div>
                <h1>Logged in as {user.username}</h1>
                <button onClick={() => me()}>Alert my info</button>
                <button onClick={() => logout()}>Logout</button>
            </div>
        ) : (
              <div>
                  <h1>Not logged in</h1>
                  <button onClick={() => login('admin', 'foo')}>Login</button>
              </div>
          ))}
    </div>
);

export default withRedux(
    makeStore,
    (state) => ({user: state.user, error: state.error}),
    {login, logout, me}
)(Index);
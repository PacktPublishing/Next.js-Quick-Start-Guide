import React from "react";
import {login, logout, makeStore} from "../lib/redux";
import withRedux from "next-redux-wrapper";
import withRbac from "../lib/withRbac";
import pages from "../lib/pages";
import {canReadPages, canWritePost} from "../lib/bl";

let Index = ({login, logout, user, error, granted}) => (
    <div>
        {error && (<div>Login error: {error}</div>)}
        {(granted ? (
            <div>
                <h1>Logged in as {user.username}</h1>
                {pages.map((page, index) => (
                    <div key={index}>
                        {page.title} - {canWritePost(user, page) ? 'Can Write' : 'Can Read'}
                    </div>
                ))}
                <button onClick={() => logout()}>Logout</button>
            </div>
        ) : (
              <div>
                  <h1>Not logged in</h1>
                  <button onClick={() => login('admin', 'foo')}>Login Admin</button>
                  <button onClick={() => login('user', 'foo')}>Login User</button>
              </div>
          ))}
    </div>
);

Index = withRbac(user => canReadPages(user))(Index);
Index = withRedux(
    makeStore,
    (state) => ({
        user: state.user,
        error: state.error
    }),
    {login, logout}
)(Index);

export default Index;
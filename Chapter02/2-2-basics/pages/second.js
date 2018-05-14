import React from 'react';
import Error from 'next/error';
import Nav from "../components/Nav";
import posts from "../data/posts";

export default ({url: {query: {id}}}) => (
    (posts[id]) ? (
        <div>
            <Nav/>
            <hr/>
            <h1>{posts[id].title}</h1>
        </div>
    ) : (
        <Error statusCode={404}/>
    )
);
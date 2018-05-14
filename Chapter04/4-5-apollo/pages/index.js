import React from 'react';
import {graphql} from 'react-apollo';
import gql from 'graphql-tag';
import withData from "../components/withData";

const query = gql`
    query {
        allFilms {
            id,
            director,
            title,
            characters {
                name
            }
        }
    }
`;

let Index = ({data: {loading, allFilms, error}}) => {

    if (error) return (
        <div>Error! {error.message}</div>
    );

    if (loading) return (
        <div>Loading...</div>
    );

    return (
        <div>
            {allFilms.map(film => (
                <div key={film.id}>
                    <h1>{film.title}</h1>
                    <p>Director: {film.director}</p>
                    <p>Characters: {film.characters.map(c => c.name).join(', ')}</p>
                </div>
            ))}
        </div>
    );

};

Index = graphql(query)(Index);
Index = withData(Index);

export default Index;
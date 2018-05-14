import React from 'react';
import {fetchQuery, graphql, QueryRenderer} from 'react-relay';
import getEnvironment from "../components/environment";

const query = graphql`
    query pagesFilmsQuery {
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

const Films = ({error, allFilms = null}) => {

    if (error) return (
        <div>Error! {error.message}</div>
    );

    if (!allFilms) return (
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

class Index extends React.Component {

    constructor(props, context){
        super(props, context);
        this.environment = getEnvironment(props.records);
    }

    render() {
        const {props, records} = this.props;
        return (
            <div>
                <h1>On Server</h1>
                <Films allFilms={props.allFilms}/>
                <pre>{JSON.stringify(records, null, 2)}</pre>
                <hr/>
                <h1>On Client</h1>
                <QueryRenderer
                    environment={this.environment}
                    query={query}
                    variables={{}}
                    render={({error, props}) => (
                        <Films error={error} allFilms={props && props.allFilms}/>
                    )}
                />
            </div>
        );
    }

}

Index.getInitialProps = async () => {
    const environment = getEnvironment();
    const props = await fetchQuery(environment, query, {});
    const records = environment.getStore().getSource().toJSON(); // we use this to pre-populate the store on client
    return {
        props, records
    };
};

export default Index;
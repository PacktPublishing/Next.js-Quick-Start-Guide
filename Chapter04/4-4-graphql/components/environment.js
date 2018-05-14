import 'isomorphic-fetch';
import {Environment, Network, RecordSource, Store} from 'relay-runtime';
import config from 'json-loader!../.graphqlconfig';

const fetchQuery = async (operation, variables) => {

    const res = await fetch(config.extensions.endpoints.dev, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            query: operation.text,
            variables,
        }),
    });

    return await res.json();

};

let environment;

export const getEnviroment = (records) => {
    if (!environment || !process.browser) {
        environment = new Environment({
            network: Network.create(fetchQuery),
            store: new Store(new RecordSource(records)),
        });
    }
    return environment;
};

export default getEnviroment;
import {withData} from 'next-apollo'
import {HttpLink} from 'apollo-link-http'

const config = {
    link: new HttpLink({
        uri: 'https://swapi.graph.cool',
        opts: {
            credentials: 'same-origin'
        }
    })
};

export default withData(config);
import {shallow} from 'enzyme';
import React from 'react';
import renderer from 'react-test-renderer';
import Index from './index.js'

describe('Enzyme', () => {

    it('Renders "Hello octocat!" for given props', () => {
        const app = shallow(<Index userinfo={{login: 'octocat'}}/>);
        expect(app.find('div').text()).toEqual('Hello, octocat!');
    });

});

describe('Snapshot Testing', () => {

    it('Renders "Hello octocat!" for given props', () => {
        const component = renderer.create(<Index userinfo={{login: 'octocat'}}/>);
        const tree = component.toJSON();
        expect(tree).toMatchSnapshot();
    });

    it('Renders "Hello octocat!" for emulated NextJS lifecycle', async () => {
        const userinfo = Index.getInitialProps({});
        const component = renderer.create(<Index userinfo={userinfo}/>);
        const tree = component.toJSON();
        expect(tree).toMatchSnapshot();
    });

});
import React from 'react';
import renderer from 'react-test-renderer';
import Index from './index.js'

describe('Snapshot Testing', () => {

    it('Renders "Hello, World!"', () => {
        const component = renderer.create(<Index/>);
        const tree = component.toJSON();
        expect(tree).toMatchSnapshot();
    });

});
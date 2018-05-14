import React from 'react';
import renderer from 'react-test-renderer';
import Index from './index.js'

describe('Snapshot Testing', () => {

    it('Renders "Hello, World!"', () => {
        expect(renderer.create(<Index/>).toJSON()).toMatchSnapshot();
    });

});
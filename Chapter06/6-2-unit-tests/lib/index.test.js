import {getOctocat, sum} from "./index";

describe('sum', () => {

    it('sums two values', () => {
        expect(sum(2, 2)).toEqual(4);
    });

});

describe('getOctocat', () => {

    it('fetches octocat userinfo from GitHub', async () => {
        const userinfo = await getOctocat();
        expect(userinfo.login).toEqual('octocat');
    });

});
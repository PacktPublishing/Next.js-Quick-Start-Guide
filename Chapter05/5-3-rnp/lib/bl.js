import {checkGrant} from "./rbac";

export const canWritePost = (user, post) =>
    checkGrant(user, (user.username == post.user ? 'updateOwn' : 'updateAny'), 'page');

export const canReadPages = (user) =>
    checkGrant(user, 'readAny', 'page');
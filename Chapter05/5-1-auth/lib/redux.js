import {applyMiddleware, createStore} from 'redux';
import thunk from 'redux-thunk';
import logger from 'redux-logger';

const LOGIN_SUCCESS = 'LOGIN_SUCCESS';
const LOGIN_ERROR = 'LOGIN_ERROR';
const LOGOUT = 'LOGOUT';
const DEFAULT_STATE = {
    user: null,
    token: null,
    error: null
};

export const reducer = (state = DEFAULT_STATE, {type, payload}) => {
    switch (type) {
        case LOGIN_SUCCESS:
            return {
                ...state,
                ...DEFAULT_STATE,
                user: payload.user,
                token: payload.token
            };
        case LOGOUT:
            return {
                ...state,
                ...DEFAULT_STATE
            };
        case LOGIN_ERROR:
            return {
                ...state,
                ...DEFAULT_STATE,
                error: payload
            };
        default:
            return state
    }
};

const SERVER = 'http://localhost:3000';

const apiRequest = ({url, body = undefined, method = 'GET'}) => fetch(SERVER + url, {
    method,
    body: typeof body === 'undefined' ? body : JSON.stringify(body),
    headers: {'content-type': 'application/json'},
    credentials: 'include'
});

export const login = (username, password) => async (dispatch) => {
    try {
        const res = await apiRequest({
            url: '/api/login',
            body: {username, password},
            method: 'POST'
        });
        const json = await res.json();
        if (!res.ok) {
            dispatch({type: LOGIN_ERROR, payload: json.message});
            return;
        }
        dispatch({type: LOGIN_SUCCESS, payload: json});
    } catch (e) {
        dispatch({type: LOGIN_ERROR, payload: e.message});
    }
};

export const logout = () => async (dispatch) => {
    try {
        await apiRequest({
            url: '/api/logout',
            method: 'POST'
        });
    } catch (e) {}
    dispatch({type: LOGOUT});
};

export const me = () => async (dispatch) => {
    // We don't dispatch anything for demo purposes only
    try {
        const res = await (await apiRequest({url: '/api/me'})).json();
        alert(JSON.stringify(res));
    } catch (e) {
        console.error(e.stack);
    }
};

export const makeStore = (initialState, {isServer, req, debug, storeKey}) => {
    if (isServer) {
        // only do it now bc on client it should be undefined by default
        initialState = initialState || {};
        // server will put things in req
        initialState.user = req.user;
        initialState.token = req.token;
        initialState.error = null;
    }
    return createStore(reducer, initialState, applyMiddleware(thunk, logger));
};
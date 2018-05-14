import React from "react";
import Link from "next/link";
import withRedux from "next-redux-wrapper";
import {makeStore, setClientState} from "../lib/redux";

const Index = ({fromServer, fromClient, setClientState}) => (
    <div>
        <div>
            Not gated | <Link href="/gated"><a>Gated</a></Link>
        </div>
        <div>fromServer: {fromServer}</div>
        <div>fromClient: {fromClient}</div>
        <div>
            <button onClick={e => setClientState('bar')}>Set Client State</button>
        </div>
    </div>
);

export default withRedux(
    makeStore,
    (state) => state,
    {setClientState}
)(Index);
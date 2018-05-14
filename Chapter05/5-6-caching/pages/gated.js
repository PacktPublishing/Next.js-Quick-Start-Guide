import React from "react";
import Link from "next/link";
import withRedux from "next-redux-wrapper";
import {makeStore, setClientState} from "../lib/redux";
import withPersistGate from "../lib/withPersistGate";

const Index = ({fromServer, fromClient, setClientState}) => (
    <div>
        <div>
            <Link href="/"><a>Not gated</a></Link> | Gated
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
)(withPersistGate({
    loading: (<div>Loading</div>)
})(Index));
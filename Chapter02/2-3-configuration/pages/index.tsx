import React from 'react';
import getConfig from 'next/config'
import "./index.sass";

const {serverRuntimeConfig, publicRuntimeConfig} = getConfig();

console.log({serverRuntimeConfig, publicRuntimeConfig});

export default () => (
    <div>
        Styled text
        <pre>{JSON.stringify(serverRuntimeConfig, null, 2)}</pre>
        <pre>{JSON.stringify(publicRuntimeConfig, null, 2)}</pre>
    </div>
);
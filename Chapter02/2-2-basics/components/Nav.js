import React from "react";
import Btn from "./Btn";
import Link from 'next/link';
import PNG from '../static/js.png';
import './Nav.css';

export default () => (
    <nav>
        <span className="logo logo-css"/>
        <img src={PNG} className="logo" alt="Logo"/>
        <Link href="/" passHref><Btn>Index</Btn></Link>
        <Link href="/second" passHref><Btn>Second</Btn></Link>
    </nav>
);
import React from "react";
import Link from "next/link";
import withGA from "../lib/withGA";

const Index = () => (
    <div>
        Analyze this!
        <div>
            Analyze this! | <Link href="/that"><a>Analyze that!</a></Link>
        </div>
    </div>
);

export default withGA(Index);
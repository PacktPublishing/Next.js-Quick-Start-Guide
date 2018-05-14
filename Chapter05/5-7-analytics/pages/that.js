import React from "react";
import Link from "next/link";
import withGA from "../lib/withGA";

const Index = () => (
    <div>
        Analyze this!
        <div>
            <Link href="/"><a>Analyze this!</a></Link> | Analyze that!
        </div>
    </div>
);

export default withGA(Index);
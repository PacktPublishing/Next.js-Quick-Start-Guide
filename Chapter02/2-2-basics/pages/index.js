import React from 'react';
import Link from "next/link";
import Nav from "../components/Nav";
import posts from "../data/posts";
import {HorizontalGridLines, LineSeries, XAxis, XYPlot, YAxis} from 'react-vis';
import "react-vis/dist/style.css";

//@import "./node_modules/react-vis/dist/styles/legends";

export default () => (
    <div>

        <Nav/>

        <hr/>

        <ul>
            {posts.map((post, index) => (
                <li key={index}>
                    <Link as={`/post/${index}`}
                          href={{pathname: '/second', query: {id: index}}}><a>{post.title}</a></Link>
                </li>
            ))}
        </ul>

        <hr/>

        <XYPlot
            width={300}
            height={300}>
            <HorizontalGridLines/>
            <LineSeries
                data={[
                    {x: 1, y: 10},
                    {x: 2, y: 5},
                    {x: 3, y: 15}
                ]}/>
            <XAxis/>
            <YAxis/>
        </XYPlot>

    </div>
);
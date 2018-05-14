import Index from "./components/Index";
import List from "./components/List";

const routes = [
    {
        path: '/',
        exact: true,
        component: Index
    },
    {
        path: '/list',
        component: List
    }
];

export default routes;
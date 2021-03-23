import Fallback from 'components/Layout/Fallback';
import React, { lazy, Suspense } from 'react'
import { Route, Switch, BrowserRouter } from 'react-router-dom'
import Layout from '../components/Layout/Layout';
import Login from './Login'

const routes = [
  {
    path: "/",
    exact: true,
    component: lazy(()=>import("./Home")),
  },{
    path: "/task/:id",
    exact: true,
    component: lazy(()=>import("./Task/Task")),
  },{
    path: "/admin",
    exact: true,
    component: lazy(()=>import("./Admin/Admin")),
  },
];

function Routes() {
  return (
    <BrowserRouter>
      <Switch>
        <Layout loginPage={Login}>{/*//? Auth logic in Layout */}
          {routes.map(route=>(
            <Route
              key={"route"+route.path}
              path={route.path}
              render={()=>(
                <Suspense fallback={<Fallback/>}>
                  <route.component/>
                </Suspense>
              )}
              exact={route.exact}
            />
          ))}
        </Layout>
      </Switch>
    </BrowserRouter>
  )
}

export default Routes

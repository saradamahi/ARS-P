/**
 * The App file. It should stay as simple as possible
 */
import React, { Fragment } from "react";

import Content from "./components/Content.js";
import "./App.scss";

const App = (props) => {
  return (
    <Fragment>
      <h1 className="header">React Bryntum Demo</h1>
      <Content />
    </Fragment>
  );
};

export default App;

import React from 'react';

import classes from './Output.module.css';

const createMarkup = (data)=>({
  __html: data.replace(/\n/g, "<br>"),
})

function Output({data=""}) {
  return (
    <code
      className={classes.code}
      dangerouslySetInnerHTML={createMarkup(data)}
    ></code>
  )
}

export default Output

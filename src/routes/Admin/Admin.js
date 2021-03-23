import React, { useEffect, useState } from 'react'
import { fetchCollection } from 'store/api';

function Admin() {

  const [state, setState] = useState({
    languages: [],
  });

  useEffect(()=>{
    fetchCollection("hackerrank").then(data=>{
      setState({
        ...state,
        languages: data,
      });
    });
  },[state, setState]);

  return (
    <div>
      Admin Page
      <table border="1">
        <caption>Languages</caption>
        <thead>
          <tr>
            <th>Title</th>
            <th>versionIndex</th>
          </tr>
        </thead>
        <tbody>
          {state.languages.map(lang=>(
            <tr key={'language-'+lang.id}>
              <td>{lang.language}</td>
              <td>{lang.versionIndex}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default Admin

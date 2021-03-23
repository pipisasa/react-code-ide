import React, { useEffect, useState } from 'react'
import { toastr } from 'react-redux-toastr';
import { useParams } from 'react-router-dom';
import { fetchDocument } from 'store/api';
import Edititor from '../../components/Editor'
import Output from '../../components/Output'
import firebaseApi from '../../firebaseApi'

const fetchData = async (id)=>{
  const data = await fetchDocument(`hackerrank/0/tasks`, id);
  const langOptions = await fetchDocument(`hackerrank/0/langs`, data.lang);
  return {data, langOptions};
};

const createScriptStr = (val, {data: {input, call}, langOptions: {input_variable}})=>{
  const inp = input_variable.replace("$inp", input);
  return `${val}\n${inp}\n${call}`;
};

function Task() {
  const [state, setState] = useState({
    output: `...`,
    loading: false,
    error: null,
    orientation: "col",
    data: null,
    langOptions: null,
  });

  const {id} = useParams();

  useEffect(()=>{
    if(!state.data){
      fetchData(id).then(({data, langOptions})=>{
        setState({
          ...state,
          data,
          langOptions,
        });
      });
    }
  },[id, setState, state]);

  const setLoading = ()=>{
    setState({
      ...state,
      loading: true,
      error: null,
      output: "Loading..."
    });
  }

  const onResponse = ({data})=>{
    const output = data.output.slice(0, data.output.length-1);
    setState({
      ...state,
      output: output || "...",
      error: null,
      loading: false,
    });
    if(output.match("jdoodle")){
      toastr.error("Error", "Something went wrong...", {
        timeOut: 60000
      })
    }else if(output === state.data.output){
      toastr.success("Success", "Task Completed!", {
        timeOut: 60000
      })
    }
  };

  const onError = (error)=>{
    setState({
      ...state,
      error,
      loading: false,
      output: "Error: Something went wrong...\n"+error
    });
    toastr.error("Error", "Something went wrong...", {
      timeOut: 60000
    });
  }

  const handleSubmit = async (value)=>{
    setLoading();
    firebaseApi.app().functions().httpsCallable("httpsCodeCompiler")({
      "versionIndex": state.langOptions?.versionIndex,
      "language": state.langOptions.language,
      "script": createScriptStr(value, state)
    })
      .then(onResponse)
      .catch(onError);
  };
  console.log(state);
  return (
    <div className="container" style={{[ state.orientation === "col" ? "gridTemplateColumns" : "gridTemplateRows"]: "1fr 1fr"}}>
      <Edititor
        onSubmit={handleSubmit}
        data={state.data}
        lang={state?.langOptions?.language}
      />
      <Output
        data={state.output}
      />
    </div>
  )
}

export default Task
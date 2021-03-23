import React, { useState } from 'react'
import { toastr } from 'react-redux-toastr';
import Edititor from '../../components/Editor'
import Output from '../../components/Output'
import firebaseApi from '../../firebaseApi'

const createScriptStr = (val, {data: {input, call}, langOptions: {input_variable}})=>{
  const inp = input_variable.replace("$inp", input);
  return `${val}\n${inp}\n${call}`;
};

// const compile = (str)=>new Response((res, rej)=>{

// })

function Home() {
  const [state, setState] = useState({
    output: `...`,
    loading: false,
    error: null,
    orientation: "col",
    data: {
      call: "",
      createdAt: "Wed Mar 17 2021",
      description: "",
      id: "fizzbuzz",
      input: "",
      lang: "nodejs",
      output: `1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz\n16\n17\nFizz\n19\nBuzz\nFizz\n22\n23\nFizz\nBuzz\n26\nFizz\n28\n29\nFizzBuzz\n31\n32\nFizz\n34\nBuzz\nFizz\n37\n38\nFizz\nBuzz\n41\nFizz\n43\n44\nFizzBuzz\n46\n47\nFizz\n49\nBuzz\nFizz\n52\n53\nFizz\nBuzz\n56\nFizz\n58\n59\nFizzBuzz\n61\n62\nFizz\n64\nBuzz\nFizz\n67\n68\nFizz\nBuzz\n71\nFizz\n73\n74\nFizzBuzz\n76\n77\nFizz\n79\nBuzz\nFizz\n82\n83\nFizz\nBuzz\n86\nFizz\n88\n89\nFizzBuzz\n91\n92\nFizz\n94\nBuzz\nFizz\n97\n98\nFizz\nBuzz`,
      template: "//FizzBuzz\n\nfor(let i=1; i<=100; i++){\n  // выведите Fizz если число делится на 3\n  // выведите Buzz если число делится на 5\n  // выведите FizzBuzz если число делится и на 3 и на 5\n  // иначе выведите само число\n}",
      title: "FizzBuzz",
    },
    langOptions: {
      input_variable: "",
      language: "nodejs",
      title: "JavaScript",
      versionIndex: "3"
    },
  });

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

export default Home
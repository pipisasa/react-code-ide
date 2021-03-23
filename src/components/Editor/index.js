import React, { useEffect } from 'react'

import AceEditor from "react-ace";

import "ace-builds/src-noconflict/theme-monokai";
import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/ext-language_tools";

import classes from './Editor.module.css';

// const fizzBuzz = `function main(){\n  //Напишите ваш код здесь\n  for(let i=0;i<100;i++)console.log(i%15?i%5?i%3?i:"Fizz":"Buzz":"FizzBuzz");\n};\nmain();`;

const langs = {
  "nodejs": "javascript",
  "python": "python",
  "python3": "python",
}

function Edititor({onSubmit, data, lang="nodejs", ...props}) {
  const [value, setValue] = React.useState('Loading...');

  const onLoad = ()=>{
    // console.log("Loaded");
  }
  const onChange = (val)=>{
    setValue(val);
  };
  const handleSubmit = ()=>{
    onSubmit(value);
  };

  const saveKeyHandler = (e) => {
    if ((window.navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey)  && e.code == "KeyS") {
      e.preventDefault();
      handleSubmit();
    }
  }

  useEffect(()=>{
    document.addEventListener("keydown", saveKeyHandler, false);
    return ()=>{
      document.removeEventListener(saveKeyHandler);
    }
  },[])

  useEffect(() => {
    if(data)setValue(data.template)
  }, [data])

  return (<>
    <button className={classes.Editor__SubmitBtn} onClick={handleSubmit}>RUN</button>
    <div className={classes.Editor}>
      <AceEditor
        className={classes.Editor__Ace}
        placeholder="Hello world"
        mode={langs[lang]}
        theme="monokai"
        name="editor-1"
        onLoad={onLoad}
        onChange={onChange}
        fontSize={18}
        showPrintMargin={true}
        showGutter={true}
        highlightActiveLine={true}
        value={value}
        tabSize={2}
        setOptions={{
          enableBasicAutocompletion: true,
          enableLiveAutocompletion: true,
          enableSnippets: false,
          showLineNumbers: true,
          tabSize: 2,
        }}
      />
    </div>
  </>);
}

export default Edititor

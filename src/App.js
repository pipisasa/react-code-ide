import React from 'react'
import { Provider } from 'react-redux'
import Routes from './routes'
import { PersistGate } from 'redux-persist/integration/react';
import ReduxToastr from 'react-redux-toastr';
import 'react-redux-toastr/lib/css/react-redux-toastr.min.css';
import confStore from 'store/store';


const { store, persistor } = confStore({})

function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ReduxToastr
          newestOnTop={false}
          preventDuplicates
          position="bottom-right"
          getState={state => state.toastr}
          transitionIn="fadeIn"
          transitionOut="fadeOut"
          progressBar
          closeOnToastrClick
        />
        <Routes/>
      </PersistGate>
    </Provider>
  )
}

export default App

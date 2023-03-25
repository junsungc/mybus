import './App.css';
import Map from './Map'
import { Provider } from 'react-redux';
import { legacy_createStore } from 'redux';
import reducer from './component/reducer';

const store = legacy_createStore(reducer)

function App() {
  return (
    <Provider store={store}>
      <div className="App">
        <Map></Map>
      </div>
    </Provider>
  );
}

export default App;

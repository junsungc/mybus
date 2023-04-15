import './App.css';
import Map from './Map'
import { Provider } from 'react-redux';
import { legacy_createStore } from 'redux';
import reducer from './component/reducer';
import Bus from './component/Bus';

const store = legacy_createStore(reducer)

function App() {
  return (
    <Provider store={store}>
      <div className="App">
        <Map></Map>
        {/* <Bus></Bus> */}
      </div>
    </Provider>
  );
}

export default App;

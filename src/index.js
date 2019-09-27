import React from 'react';
import ReactDOM from 'react-dom';
import { HashRouter as Router, Route } from 'react-router-dom';
import EmailerButton from './components/EmailerButton/EmailerButton';
import EmailForm from './components/EmailForm/EmailForm';
import Configure from './components/Configure/Configure';
import * as serviceWorker from './serviceWorker';

class App extends React.Component {
    render() {
      return (
        //   <Router basename={process.env.PUBLIC_URL}>
        <Router basename={process.env.PUBLIC_URL}>
          <React.Fragment>
            <Route path="/extension" component={EmailerButton} />
            <Route path="/config" component={Configure} />
            <Route path="/emailform" component={EmailForm} />
          </React.Fragment>
        </Router>
      );
    }
  }

ReactDOM.render(<App />, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();

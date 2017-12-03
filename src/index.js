import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import TableauStream from './nivo_stream.js';
import registerServiceWorker from './registerServiceWorker';

//ReactDOM.render(<App />, document.getElementById('root'));

class Hello extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      clickCount : 1, 
      markE : {}
    }

    this.getUrlVars = this.getUrlVars.bind(this);
    this.onMarkSelect = this.onMarkSelect.bind(this);
  }
  
  // Copied from http:jquery-howto.blogspot.com/2009/09/get-url-parameters-values-with-jquery.html
  getUrlVars() {
    var vars = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    console.log(hashes);
    for (var i = 0; i < hashes.length; i++) {
      hash = hashes[i].split('=');
      vars.push(hash[0]);
      vars[hash[0]] = hash[1];
    }
    return vars;
  }

  onMarkSelect(markEvent) {
    console.log("made mark it");
    this.setState({
      clickCount : this.state.clickCount + 1, 
      markE : markEvent
    });
  }

  // var urlParams = getUrlVars();
  // var clickCount = 1;
  // var markE = {};

  render() {    
    console.log(this.state);
    switch (this.getUrlVars()["startPage"]) {
      case undefined:
      console.log("undefined");
      return (<TableauStream mark={this.state.clickCount} markEvent={this.state.markE} />);

      case "Tableau":
      default:
      console.log("Tableau");
        // setTimeout(function() {
        //   console.log('adding event listeners');
        //   console.log(window.tableau.VizManager.getVizs()[0]);
        //   window.tableau.VizManager.getVizs()[0].addEventListener("marksselection", this.onMarkSelect);
        // }, 2000);

      return (<App markSelect = {this.onMarkSelect} />);
    }
  }
}

ReactDOM.render(<Hello />, document.getElementById("root"));

registerServiceWorker();

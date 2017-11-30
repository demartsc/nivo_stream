import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import TableauStream from './nivo_stream.js';
import registerServiceWorker from './registerServiceWorker';

//ReactDOM.render(<App />, document.getElementById('root'));

// Copied from http:jquery-howto.blogspot.com/2009/09/get-url-parameters-values-with-jquery.html
function getUrlVars() {
  var vars = [], hash;
  var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
  for (var i = 0; i < hashes.length; i++) {
    hash = hashes[i].split('=');
    vars.push(hash[0]);
    vars[hash[0]] = hash[1];
  }
  return vars;
}

var urlParams = getUrlVars();

switch (urlParams["startPage"]) {
  case undefined:
    ReactDOM.render(<TableauStream />, document.getElementById('root'));
    break;

  case "Tableau":
  default:
    ReactDOM.render(<App />, document.getElementById('root'));
    break;
}

registerServiceWorker();

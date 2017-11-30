import React, { Component } from 'react';
import { Chord } from 'nivo';
import Tableau from 'tableau-api';
import _ from 'lodash';

class TableauStream extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: true,
      viz: {},
      data: {}, 
      chordParms: {},
      keys: null,
      matrix: null, 
      col_names: []
    };

    //this.updateData = this.updateData.bind(this);
    this.defaultData =[];
    /*
    [
      [ 64, 331, 491, 77, 202 ],
      [ 1775, 440, 944, 1052, 154 ],
      [ 18, 397, 404, 42, 125 ],
      [ 374, 415, 494, 242, 790 ],
      [ 1363, 376, 627, 319, 98 ]
    ];
    */
    this.defaultKeys = []; // [ "React", "D3", "Is", "Awesome", "Tableau"];
    
    this.viz = {};
    this.workbook = {};
    this.activeSheet = {};
    this.sheets = {};

    this.uniqKeys = [];
    this.matrix = [];
    this.chordParms = [];
    this.data = [];

    this.getColumnIndexes = this.getColumnIndexes.bind(this);
    this.convertRowToObject = this.convertRowToObject.bind(this);
    this.matrixify = this.matrixify.bind(this);
    this.handleClick = this.handleClick.bind(this);
  }

  getColumnIndexes(table, required_keys) {
    let colIdxMaps = {};
    let ref = table.getColumns();
    for (let j = 0; j < ref.length; j++) {
      let c = ref[j];
      let fn = c.getFieldName();
      for (let x = 0; x < required_keys.length; x++) {
        if (required_keys[x] === fn) {
          colIdxMaps[fn] = c.getIndex();
        }        
      }
    }
    return colIdxMaps;
  };

  convertRowToObject(row, attrs_map) {
    let o = {};
    let name = "";
    for (name in attrs_map) {
      let id = attrs_map[name];
      o[name] = row[id].value;
    }
    return o;
  };

  matrixify(arr, size, col_names)
  {
    var matrix = [];
    for(var i=0; i < size; i++) {
      matrix[i] = [];
      for(var j=0; j < size; j++) {
        matrix[i][j] = 0.0; // default all values to 0
      }
    }

    for(i=0; i < size; i++) {
      for(j=0; j < size; j++) {
        for (var k=0; k<arr.length; k++){
          if (arr[k][col_names[0]] === this.uniqKeys[i] && arr[k][col_names[1]] === this.uniqKeys[j]) {
            matrix[i][j] = parseFloat(arr[k][col_names[2]]); //if we find a match, then populate value
            if (matrix[j][i] === 0.0) {
              matrix[j][i] = parseFloat(arr[k][col_names[2]]); //if we find a match, then populate value
            }
          } // testing this out, will need to remove it
        }
      }
    }
    //console.log(matrix);
    return matrix;
  }

  // this function is made to be a simple demonstration of interacting with tableau from nivo click event
  handleClick(data, e) {
    let tempArray = {};
    //console.log('Nivo chord was clicked');
    //console.log(data, e.target);

    // check whether it is a ribbon or arc (this could be done better)
    if ("id" in data) { // arc clicked, just select that value
      for (var q = 0; q < this.sheets.length; q++) {
        this.sheets[q].selectMarksAsync(this.state.col_names[0],data.id,"REPLACE");
        this.sheets[q].selectMarksAsync(this.state.col_names[1],data.id,"ADD");
      }    
    } else { // ribbon clicked, we need to target specific here. 
      // we have to be on a dashboard since we have an html page, loop and select marks
      // we also know that names 0 and 1 must be the dimensions that we can select
      tempArray[this.state.col_names[0]] = data.source.id;
      tempArray[this.state.col_names[1]] = data.target.id;
      for (q = 0; q < this.sheets.length; q++) {
        this.sheets[q].selectMarksAsync(tempArray,"REPLACE");
      }    
      tempArray[this.state.col_names[0]] = data.target.id;
      tempArray[this.state.col_names[1]] = data.source.id;
      for (q = 0; q < this.sheets.length; q++) {
        this.sheets[q].selectMarksAsync(tempArray,"ADD");
      }    
    }
  }

  componentDidUpdate() {
    console.log("updated");
  }

  componentDidMount() {
    console.log("mounted");
    this.viz = window.top.tableau.VizManager.getVizs()[0];
    this.workbook = this.viz.getWorkbook();
    this.activeSheet = this.workbook.getActiveSheet();
    this.sheets = this.activeSheet.getWorksheets();

    // simplify reference to active tab name
    let activeSheetName = this.activeSheet.getName().toString();

    this.workbook.getParametersAsync().then(t => {
      for (let j = 0; j < t.length; j++) {
        if (t[j].getName().toUpperCase() === 'CHORD PARMS') {
          this.chordParms = JSON.parse(t[j].getCurrentValue().formattedValue.toString());
        }
      }
      //console.log(t); // log parms for troubleshooting

      // getData() code for react from https://github.com/cmtoomey/TableauReact
      // we are still in the parameter async.then call here, chaining the get data call after it
      let sheet = {};
      if (activeSheetName in this.chordParms) { // need to check this more gracefull across the whole file. 
        if ("dataSheet" in this.chordParms[activeSheetName]) { 
          sheet = this.sheets.get(this.chordParms[activeSheetName].dataSheet);
        }
        else  {
          sheet = this.sheets[0];
        }
      }
      else  {
        sheet = this.sheets[0];
      }
      const options = {
          ignoreAliases: false,
          ignoreSelection: true,
          includeAllColumns: false
      };
      sheet.getSummaryDataAsync(options).then((t) => {
        //const table = t;  //not sure if we need this
        const tableauData = t.getData();
        let col_names = [];
        let col_indexes = [];
        //console.log(tableauData);

        // if we have been sent parms for this dashboard grab fields
        if (activeSheetName in this.chordParms) {
          if ("inField" in this.chordParms[activeSheetName]) {
            col_names.push(this.chordParms[activeSheetName].inField);
          } else {
            col_names.push(t.getColumns()[0].getFieldName());
          }

          if ("outField" in this.chordParms[activeSheetName]) {
            col_names.push(this.chordParms[activeSheetName].outField);
          } else {
            col_names.push(t.getColumns()[1].getFieldName());
          }

          if ("valField" in this.chordParms[activeSheetName]) {
            col_names.push(this.chordParms[activeSheetName].valField);
          } else {
            col_names.push(t.getColumns()[2].getFieldName());
          }
        } else {
            col_names.push(t.getColumns()[0].getFieldName());
            col_names.push(t.getColumns()[1].getFieldName());
            col_names.push(t.getColumns()[2].getFieldName());
        }
        //console.log(col_names);
        col_indexes = this.getColumnIndexes(t,col_names);
        //console.log(col_indexes);

        // now that we have the column name and indexes we can build our table for chord
        for (let j = 0, len = tableauData.length; j < len; j++) {
          //console.log(this.convertRowToObject(tableauData[j], col_indexes));
          this.data.push(this.convertRowToObject(tableauData[j], col_indexes));
        }
        //console.log(this.data);
  
        // use lodash to create a unique list of values in an array
        this.uniqKeys = _.union(_.map(this.data,col_names[0]),_.map(this.data, col_names[1]));
        //this.uniqKeys = _.sortBy(_.union(_.map(this.data,col_names[0]),_.map(this.data, col_names[1])));
        //console.log(this.uniqKeys);

        // this doesn't work yet but can use something like this to create matrix from array
        this.matrix = this.matrixify(this.data, this.uniqKeys.length, col_names);
        
        // update state after we do all of this stuff, triggers re-render
        this.setState({
            viz: this.viz,
            data: this.data, 
            keys: this.uniqKeys,
            matrix: this.matrix, 
            chordParms: this.chordParms[activeSheetName],
            col_names: col_names
        }); // these error calls do not do anything
      }, function(err) {return console.error("Error during Tableau Async request:", err._error.message, err._error.stack);});
    }, function(err) {return console.error("Error during Tableau Async request:", err._error.message, err._error.stack);});
  }

  render() {
    const { // this will remove the props that we use above, may not be necessary, but i like it
      dataSheet, 
      inField, 
      outField, 
      valField, 
      ...restChordProps
    } = this.state.chordParms || {};
    
    return ( //onMouseOver={this.handleClick} onClick={this.handleClick}
       <div id = "chordDiv" >
         <Chord
                id = "id" // this doesn't work :(, if we can get the value added we can use event listeners no prob
                matrix={this.state.matrix || this.defaultData}
                keys={this.state.keys || this.defaultKeys}
                margin={{
                    "top": 60,
                    "right": 60,
                    "bottom": 60,
                    "left": 60
                }}
                height={500}
                width={500}
                padAngle={0.02}
                innerRadiusRatio={0.96}
                innerRadiusOffset={0.02}
                arcOpacity={1}
                arcBorderWidth={1}
                arcBorderColor="inherit:darker(0.4)"
                ribbonOpacity={0.5}
                ribbonBorderWidth={1}
                ribbonBorderColor="inherit:darker(0.4)"
                enableLabel={true}
                label="id"
                labelOffset={12}
                labelRotation={-90}
                labelTextColor="inherit:darker(1)"
                colors="set3"
                isInteractive={true}
                arcHoverOpacity={1}
                arcHoverOthersOpacity={0.15}
                ribbonHoverOpacity={1}
                ribbonHoverOthersOpacity={0.15}
                animate={true}
                motionStiffness={90}
                motionDamping={7}
                onClick={(data, event) => this.handleClick(data, event)}
                {...restChordProps} // this is passed from users and will overwrite above defaults
            />
      </div>
    );
  }
}

export default TableauStream;

import React, { Component } from 'react';
import { Stream } from 'nivo';
import Tableau from 'tableau-api';
import _ from 'lodash';

class TableauStream extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: true,
      viz: {},
      data: {}, 
      streamParms: {},
      keys: null,
      matrix: [], 
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
    this.uniqAxis = [];
    this.matrix = [];
    this.streamParms = [];
    this.data = [];

    this.getColumnIndexes = this.getColumnIndexes.bind(this);
    this.convertRowToObject = this.convertRowToObject.bind(this);
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

  // this function is made to be a simple demonstration of interacting with tableau from nivo click event
  handleClick(data, e) {
    let tempArray = {};
    //console.log('Nivo was clicked');
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
        if (t[j].getName().toUpperCase() === 'NIVO PARMS') {
          this.streamParms = JSON.parse(t[j].getCurrentValue().formattedValue.toString());
        }
      }
      //console.log(t); // log parms for troubleshooting

      // getData() code for react from https://github.com/cmtoomey/TableauReact
      // we are still in the parameter async.then call here, chaining the get data call after it
      let sheet = {};
      if (activeSheetName in this.streamParms) { // need to check this more gracefull across the whole file. 
        if ("dataSheet" in this.streamParms[activeSheetName]) { 
          sheet = this.sheets.get(this.streamParms[activeSheetName].dataSheet);
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
        //console.log(t);

        // if we have been sent parms for this dashboard grab fields
        if (activeSheetName in this.streamParms) {
          if ("streamField" in this.streamParms[activeSheetName]) {
            col_names.push(this.streamParms[activeSheetName].streamField);
          } else {
            col_names.push(t.getColumns()[0].getFieldName());
          }

          if ("axisField" in this.streamParms[activeSheetName]) {
            col_names.push(this.streamParms[activeSheetName].axisField);
          } else {
            col_names.push(t.getColumns()[1].getFieldName());
          }

          if ("valField" in this.streamParms[activeSheetName]) {
            col_names.push(this.streamParms[activeSheetName].valField);
          } else {
            col_names.push(t.getColumns()[2].getFieldName());
          }

          if ("colorField" in this.streamParms[activeSheetName]) {
            col_names.push(this.streamParms[activeSheetName].colorField);
          }
        } else {
            col_names.push(t.getColumns()[0].getFieldName());
            col_names.push(t.getColumns()[1].getFieldName());
            col_names.push(t.getColumns()[2].getFieldName());
        }
        //console.log(col_names);
        col_indexes = this.getColumnIndexes(t,col_names);
        //console.log(col_indexes);

        // now that we have the column name and indexes we can build our table for stream
        for (let j = 0, len = tableauData.length; j < len; j++) {
          //console.log(this.convertRowToObject(tableauData[j], col_indexes));
          this.data.push(this.convertRowToObject(tableauData[j], col_indexes));
        }
        //console.log(this.data);
  
        // use lodash to get uniq list of values in array
        this.uniqKeys = _.sortBy(_.union(_.map(this.data,col_names[0])));
        //this.uniqKeys = _.sortBy(_.union(_.map(this.data,col_names[0]),_.map(this.data, col_names[1])));
        //console.log(this.uniqKeys);

        //get uniq dates/or other axis value
        this.uniqAxis = _.union(_.map(this.data,col_names[1]));
        //console.log(this.uniqAxis);

        //try to start using temp variable
        let tempArray = {};
        // let doneArray = {};

        for (let i = 0; i < this.uniqAxis.length; i++) { // loop through axis values
          var secArray = {}; // have to declare this here 
          tempArray = _.filter(this.data,[col_names[1], this.uniqAxis[i]]); // filter on axis value
          for (let k = 0; k < tempArray.length; k++) { // for each axis value create object of all keys and values
            secArray[tempArray[k][col_names[0]]] = parseFloat( (tempArray[k][col_names[2]] === "%missing%") ? 0 : tempArray[k][col_names[2]] );
            if (col_names.length > 3) {
              secArray[tempArray[k][col_names[0]] + "Color"] = tempArray[k][col_names[3]];
            }
          }
          //console.log("secArray", secArray); // testing object creation
          this.matrix.push(secArray); // push the key value object onto 
          //left off here, we just have to figure out how to get the array right is all
        }
        //console.log("matrix",this.matrix);
        // this should be good to go, just need to figure out how to pass it all to nivo
        
        // update state after we do all of this stuff, triggers re-render
        this.setState({
            viz: this.viz,
            data: this.data, 
            keys: this.uniqKeys,
            matrix: this.matrix, 
            streamParms: this.streamParms[activeSheetName],
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
      ...restNivoProps
    } = this.state.streamParms || {};
    
    return ( //onMouseOver={this.handleClick} onClick={this.handleClick}
       <div id = "nivoDiv" >
         <Stream
                data={this.state.matrix || this.defaultData}
                keys={this.state.keys || this.defaultKeys}
                margin={{
                    "top": 30,
                    "right": 27,
                    "bottom": 0,
                    "left": 87
                }}
                axisBottom={{
                  tickSize: 0
                }}
                enableGridX={false}
                height={500}
                width={500}
                curve="catmullRom"
                offsetType="silhouette"
                order="insideOut"
                fillOpacity={0.60}
                borderColor="inherit:darker(1.5)"
                colors="set3"
                //colorBy={({ id, data }) => data[`${id}Color`]}
                isInteractive={true}
                animate={true}
                motionStiffness={90}
                motionDamping={7}
                tooltipFormat={value =>
                  `${Number(value).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                  })} T`
                }
                onClick={(data, event) => this.handleClick(data, event)}
                {...restNivoProps} // this is passed from users and will overwrite above defaults
            />
      </div>
    );
  }
}

export default TableauStream;

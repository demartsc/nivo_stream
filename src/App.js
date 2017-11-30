import React, { Component } from 'react';
import './App.css';
import Tableau from 'tableau-api';


class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      url:"https://public.tableau.com/views/NivoStreamIntegration/Dow30?:embed=y&:display_count=yes", 
      viz: {},
      tab: {}, //for testing, may need to be removed
      filter: {},
      parameter: {},
      mark: {}
    };

    this.width = 800; // default, although this gets overwritten in the initTableau function
    this.height = 800; // default, although this gets overwritten in the initTableau function
    this.viz = {};

    // bind component functions
    this.initTableau = this.initTableau.bind(this);
    this.onTabSwitch = this.onTabSwitch.bind(this);
    this.onMarkSelect = this.onMarkSelect.bind(this);
    this.onFilterChange = this.onFilterChange.bind(this);
    this.onParameterChange = this.onParameterChange.bind(this);
  }

  // was trying to use these to trigger chord refresh, but not working yet
  onTabSwitch(tabEvent) {
    console.log("made tab it");
    console.log(tabEvent);
    this.setState({
      tab: tabEvent
    })
  }

  onMarkSelect(markEvent) {
    console.log("made mark it");
    console.log(markEvent);
    this.setState({
      mark: markEvent
    })
  }

  onFilterChange(filterEvent) {
    console.log("made filter it");
    console.log(filterEvent);
    this.setState({
      filter: filterEvent
    })
  }

  onParameterChange(parmEvent) {
    console.log("made parameter it");
    console.log(parmEvent);
    this.setState({
      parameter: parmEvent
    })
  }

  componentDidUpdate() {
    console.log("app updated"); // sanity checking when parent app updates
  }

  initTableau() {
    const vizURL = this.state.url;
    const options = {
      hideTabs: false,
      width: this.width,
      height: this.height,
      onFirstInteractive: () => {
        const activeSheet = this.viz.getWorkbook().getActiveSheet();

        // need to check what happens with automatic sized workbooks...
        //console.log(activeSheet.getSize());
        if (activeSheet.getSize().maxSize) {
          this.width = activeSheet.getSize().maxSize.width;
          this.height = activeSheet.getSize().maxSize.height;
        } else {
          this.width = 800;
          this.height = 800;
        }

        // this will set the frame size the maximum allowed by the viz
        // need to vet whether this will be a problem with automatic vizzes however
        // see note herein for dashboards as well...
        // https://onlinehelp.tableau.com/current/api/js_api/en-us/JavaScriptAPI/js_api_sample_resize.html
        this.viz.setFrameSize(this.width, this.height + 100);

        // add event listeners, have yet to be able to change chord from these though
        this.viz.addEventListener(window.tableau.TableauEventName.TAB_SWITCH, this.onTabSwitch);
        this.viz.addEventListener(window.tableau.TableauEventName.FILTER_CHANGE, this.onFilterChange);
        this.viz.addEventListener(window.tableau.TableauEventName.PARAMETER_VALUE_CHANGE, this.onParameterChange);
        this.viz.addEventListener(window.tableau.TableauEventName.MARKS_SELECTION, this.onMarkSelect);
      }
    };

    // Tableau.Viz was erroring, so went back to window.tableau.Viz
    this.viz = new window.tableau.Viz(this.container, vizURL, options);
    this.setState({
       viz: this.viz
    })
  }

  componentDidMount() {
    this.initTableau(); // we are just using state, so don't need to pass anything
  }

  render() {
    return (
      <div className="App">
        <div className="tabithaRootDiv">
          <div
            id="tableauViz"
            className="tableauContainer"
            ref={c => (this.container = c)}
            style={{ margin: '0 auto' }}
          />
        </div>
      </div>
    );
  }
}

export default App;

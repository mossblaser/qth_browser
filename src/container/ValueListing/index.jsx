import React, { Component } from "react";
import PropTypes from "prop-types";

import {connect} from "react-redux";

import {qthActions} from "../../store/index.js";

import {dirname, basename, directoryExists, containsDirectory, containsProperty, containsEvent} from "../../qth_utils";

import LoadingBar from "../../presentation/LoadingBar/index.jsx";
import WarningBar from "../../presentation/WarningBar/index.jsx";
import ErrorMessage from "../../presentation/ErrorMessage/index.jsx";

import QthValueEditor from "../../presentation/QthValueEditor/index.jsx";

import RegistrationList from "../../presentation/RegistrationList/index.jsx";
import SectionHeading from "../../presentation/SectionHeading/index.jsx";

class ValueListing extends Component {
	constructor(props) {
		super(props);
		this.setProperty = this.setProperty.bind(this);
		this.deleteProperty = this.deleteProperty.bind(this);
		this.sendEvent = this.sendEvent.bind(this);
	}
	
	componentDidMount() {
		this.props.enterDirectory(dirname(this.props.path));
		this.props.watchProperty(this.props.path);
		this.props.watchEvent(this.props.path);
	}
	componentWillUnmount() {
		this.props.leaveDirectory(dirname(this.props.path));
		this.props.unwatchProperty(this.props.path);
		this.props.unwatchEvent(this.props.path);
	}
	componentWillReceiveProps(nextProps) {
		if (nextProps.path !== this.props.path) {
			// Start new watch
			this.props.enterDirectory(dirname(this.props.path));
			this.props.watchProperty(nextProps.path);
			this.props.watchEvent(nextProps.path);
			
			// Remove old watch
			this.props.leaveDirectory(dirname(this.props.path));
			this.props.unwatchProperty(this.props.path);
			this.props.unwatchEvent(this.props.path);
		}
	}
	
	setProperty(value) {
		this.props.setProperty(this.props.path, value);
	}
	deleteProperty() {
		this.props.deleteProperty(this.props.path);
	}
	sendEvent(value) {
		this.props.sendEvent(this.props.path, value);
	}
	
	render() {
		let loading = (this.props.directoryExists === undefined);
		
		let isDirectory = containsDirectory(this.props.directoryEntry || []);
		let isProperty = containsProperty(this.props.directoryEntry || []);
		let isEvent = containsEvent(this.props.directoryEntry || []);
		
		// Generate a warning message about any anomalies in this Value's
		// registration.
		let warning = null;
		if (!loading) {
			if (this.props.directoryExists === false) {
				warning = "This value is not registered! (Containing directory does not exist.)";
			} else if (this.props.directoryEntry === undefined) {
				warning = "This value is not registered! (Value not listed in directory.)";
			} else if (this.props.directoryEntry.length > (isDirectory ? 2 : 1)) {
				warning = "Multiple registrations exist.";
			} else if (this.props.directoryEntry.length === 1 && isDirectory) {
				warning = "This value is only registered as a directory.";
			}
		}
		
		let value;
		let lastUpdate;
		let treatAs;
		if (isProperty || !isEvent) {
			// NB: 'Property' mode used as fallback
			if (this.props.property) {
				value = this.props.property.value;
				lastUpdate = this.props.property.lastUpdate;
			}
			treatAs = "PROPERTY";
		} else {
			if (this.props.event) {
				value = this.props.event.value;
				lastUpdate = this.props.event.lastUpdate;
			}
			treatAs = "EVENT";
		}
		
		// Choose some suitable suggestions based on the current value
		const suggestionSet = new Set();
		if (isEvent) {
			// Null is always a good one for valueless events
			suggestionSet.add(null);
			
			// Resending whatever was last sent can also be good!
			if (value !== undefined) {
				suggestionSet.add(value);
			}
			
			for (const recentValue of this.props.recentEventValues) {
				suggestionSet.add(recentValue);
			}
		}
		if (isProperty) {
			if (typeof(value) === "boolean") {
				// If currently a boolean, give both options
				suggestionSet.add(true);
				suggestionSet.add(false);
			} else if (typeof(value) === "number") {
				// If currently a number, give a range of values 0-1
				suggestionSet.add(0.0);
				suggestionSet.add(0.25);
				suggestionSet.add(0.5);
				suggestionSet.add(0.75);
				suggestionSet.add(1.0);
			}
			
			for (const recentValue of this.props.recentPropertyValues) {
				suggestionSet.add(recentValue);
			}
		}
		const suggestions = Array.from(suggestionSet);
		suggestions.sort();
		
		const registrationList = this.props.directoryEntry
			? <RegistrationList
					path={this.props.path}
					registrations={this.props.directoryEntry || []}
					onValueClick={this.props.onValueClick}
					onDirectoryClick={this.props.onDirectoryClick}
				/>
			: <ErrorMessage>No registrations.</ErrorMessage>;
		
		return <div>
			{loading ? <LoadingBar /> : null}
			{warning ? <WarningBar>{warning}</WarningBar> : null}
			<QthValueEditor
				value={value}
				lastUpdate={lastUpdate}
				isProperty={treatAs === "PROPERTY"}
				showAge
				suggestions={suggestions}
				onChange={treatAs === "PROPERTY" ? this.setProperty : this.sendEvent}
				onDelete={this.deleteProperty}
			/>
			<SectionHeading>Registration</SectionHeading>
			{registrationList}
		</div>;
	}
}
ValueListing = connect(
  (state, props) => ({
    directoryExists: directoryExists(props.path, state.qth.directories),
    directoryEntry: (((state.qth.directories[dirname(props.path)] || {})
                      .contents || {})[basename(props.path)]),
    property: state.qth.properties[props.path],
    event: state.qth.events[props.path],
    recentPropertyValues: state.ui.recentPropertyValues,
    recentEventValues: state.ui.recentEventValues,
  }),
  dispatch => ({
    enterDirectory: path => dispatch(qthActions.enterDirectory(path)),
    leaveDirectory: path => dispatch(qthActions.leaveDirectory(path)),
    watchProperty: path => dispatch(qthActions.watchProperty(path)),
    watchEvent: path => dispatch(qthActions.watchEvent(path)),
    unwatchProperty: path => dispatch(qthActions.unwatchProperty(path)),
    unwatchEvent: path => dispatch(qthActions.unwatchEvent(path)),
    setProperty: (path, value) => dispatch(qthActions.setProperty(path, value)),
    deleteProperty: path => dispatch(qthActions.deleteProperty(path)),
    sendEvent: (path, value) => dispatch(qthActions.sendEvent(path, value)),
  }),
)(ValueListing);


export default ValueListing;

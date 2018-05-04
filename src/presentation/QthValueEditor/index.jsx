import React, { Component } from "react";
import PropTypes from "prop-types";

import MdEdit from "react-icons/lib/md/edit";
import MdDelete from "react-icons/lib/md/delete";

import {
	InlineToolbar,
	InlineToolbarButton,
	InlineToolbarSpacer,
} from "../InlineToolbar/index.jsx";

import {QthPropertyValue, QthEventValue} from "../QthValue/index.jsx";

import "./QthValueEditor.less";


/**
 * Display the supplied one-line suggestion text in a monospace font and with
 * truncated length.
 */
const SuggestionText = ({children}) => (
	<div className="QthValueEditor-SuggestionText">
		{children}
	</div>
);


/**
 * Display and enable editing of a Qth value.
 *
 * Props
 * -----
 * * value: The JSON-serialisable value to show (or undefined if
 *   deleted/unknown)
 * * lastUpdate: The last update time (or undefined)
 * * isProperty: True if the value should be treated as a property, otherwise
 *   the value will be treated as an event. In addition to differing display
 *   behaviour (e.g. '(deleted)' is shown for absent properties and values fade
 *   over time), controls availability of 'delete' button.
 * * showAge: If true, gives the approximate age of the displayed value.
 * * suggestions: An array of JSON-serialiseable values to show as buttons to
 *   enable the quick setting/sending of the value.
 * * onChange: Called with the new value when the value is edited by the user.
 * * onDelete: Called when the value is deleted by the user.
 */
class QthValueEditor extends Component {
	constructor(props) {
		super(props)
		
		this.state = {
			currentTime: (new Date()).getTime(),
		};
		this.intervalId = null;
		
		this.onEditClicked = this.onEditClicked.bind(this);
	}
	componentDidMount() {
		this.intervalId = setInterval(() => this.setState({
			currentTime: (new Date()).getTime(),
		}), 2500);
	}
	componentWillUnmount() {
		if (this.intervalId !== null) {
			clearInterval(this.intervalId);
			this.intervalId = null;
		}
	}
	
	onEditClicked() {
		let defaultValue = JSON.stringify(this.props.value);
		
		while (true) {
			const json = window.prompt(this.props.isProperty
			                            ? "Enter new value:"
			                            : "Enter value to send:",
			                          defaultValue);
			if (json === null) {
				// Cancel clicked.
				return;
			} else {
				try {
					const value = JSON.parse(json || "null");
					if (this.props.onChange) {
						this.props.onChange(value);
					}
					return;
				} catch (e) {
					alert(`Error parsing value: ${e.message}`);
					defaultValue = json;
				}
			}
		}
	}
	
	render() {
		let text = JSON.stringify(this.props.value, null, 2);
		const QthValue = this.props.isProperty ? QthPropertyValue : QthEventValue;
		const value = <QthValue value={this.props.value} multiline nofade
		                        lastUpdate={this.props.lastUpdate} />;
		
		let deleteButton;
		if (this.props.isProperty) {
			deleteButton = <InlineToolbarButton onClick={this.props.onDelete}>
				<MdDelete size={24} />
			</InlineToolbarButton>;
		}
		
		let suggestions = [];
		for (const suggestedValue of this.props.suggestions || []) {
			const oneline = JSON.stringify(suggestedValue);
			const formatted = JSON.stringify(suggestedValue, null, 2);
			suggestions.push(
				<InlineToolbarButton onClick={() => this.props.onChange(suggestedValue)}
				                     title={`Quick Value: ${formatted}`}
				                     key={oneline}>
					<SuggestionText>{oneline}</SuggestionText>
				</InlineToolbarButton>
			);
		}
		
		let ageText = null;
		let age = this.state.currentTime - this.props.lastUpdate;
		if (this.props.showAge && this.props.lastUpdate) {
			if (age < 5000) {
				ageText = "Just arrived.";
			} else if (age < 60 * 1000) {
				ageText = "Arrived less than a minute ago.";
			} else if (age < 2 * 60 * 1000) {
				ageText = "Arrived 1 minute ago.";
			} else if (age < 60 * 60 * 1000) {
				ageText = `Arrived ${Math.floor(age / 60000)} minutes ago.`;
			} else if (age < 2 * 60 * 60 * 1000) {
				ageText = `Arrived 1 hour ago.`;
			} else {
				ageText = `Arrived ${Math.floor(age / (60 * 60 * 1000))} hours ago.`;
			}
		}
		
		return <div className="QthValueEditor">
			<div className="QthValueEditor-value">
				{value}
			</div>
			<div className="QthValueEditor-age">
				{ageText}
			</div>
			<InlineToolbar>
				<InlineToolbarButton onClick={this.onEditClicked}>
					<MdEdit size={24} />
				</InlineToolbarButton>
				{deleteButton}
				<InlineToolbarSpacer/>
				{suggestions}
			</InlineToolbar>
		</div>;
	}
}
QthValueEditor.propTypes = {
	value: PropTypes.any,
	lastUpdate: PropTypes.number,
	isProperty: PropTypes.bool,
	showAge: PropTypes.bool,
	suggestions: PropTypes.arrayOf(PropTypes.any),
	onChange: PropTypes.func,
	onDelete: PropTypes.func,
};

export default QthValueEditor;

import React, { Component } from "react";
import PropTypes from "prop-types";

import {connect} from "react-redux";

import {qth_actions} from "../../store/index.js";

import {
	List,
	ListItem,
	ListItemIcon,
	ListItemLabel,
	ListItemLabelPrimary,
	ListItemLabelSecondary
} from "../../presentation/List/index.jsx";

import {QthEventValue, QthPropertyValue} from "../../presentation/QthValue/index.jsx";

import MdNavigateNext from "react-icons/lib/md/navigate-next";
import MdFolder from "react-icons/lib/md/folder";


class DirectoryEntry extends Component {
	componentDidMount() {
		if (this.props.isProperty) {
			this.props.watchProperty(this.props.path);
		} else if (this.props.isEvent) {
			this.props.watchEvent(this.props.path);
		}
	}
	componentWillUnmount() {
		if (this.props.isProperty) {
			this.props.unwatchProperty(this.props.path);
		} else if (this.props.isEvent) {
			this.props.unwatchEvent(this.props.path);
		}
	}
	componentWillReceiveProps(nextProps) {
		if (nextProps.path !== this.props.path ||
		    nextProps.isProperty !== this.props.isProperty ||
		    nextProps.isEvent !== this.props.isEvent) {
			// Start new watch
			if (nextProps.isProperty) {
				this.props.watchProperty(nextProps.path);
			} else if (nextProps.isEvent) {
				this.props.watchEvent(nextProps.path);
			}
			
			// Remove old watch
			if (this.props.isProperty) {
				this.props.unwatchProperty(this.props.path);
			} else if (this.props.isEvent) {
				this.props.unwatchEvent(this.props.path);
			}
		}
	}
	
	render() {
		const {path, isProperty, isEvent, isDirectory, description} = this.props;
		let {name} = this.props;
		
		// Get the requested value
		let entry = {};
		if (isProperty) {
			entry = this.props.properties[path];
		} else if (isEvent) {
			entry = this.props.events[path];
		}
		let {value, lastUpdate} = entry || {};
		
		// Choose an icon
		let icon = "?";
		if (isProperty) {
			icon = "P";
		} else if (isEvent) {
			icon = "E";
		} else if (isDirectory) {
			icon = <MdFolder size={24} />;
		}
		
		// Add a trailing slash to the name if this is a directory
		if (isDirectory) {
			const className = (isProperty || isEvent)
				? "trailing-slash-feint"
				: "trailing-slash";
			name = <span>
				{name}<span className={className}>/</span>
			</span>;
		}
		
		// Format the value (if present)
		if (isProperty) {
			value = <QthPropertyValue value={value} lastUpdate={lastUpdate} />;
		} else if (isEvent) {
			value = <QthEventValue value={value} lastUpdate={lastUpdate} />;
		} else {
			value = null;
		}
		
		// Add 'enter' directory button
		let directoryButton = null;
		if (isDirectory) {
			directoryButton = <ListItemIcon>
				<MdNavigateNext size={24}/>
			</ListItemIcon>;
		}
		
		return <ListItem tooltip={description}>
			<ListItemIcon>{icon}</ListItemIcon>
			<ListItemLabel>
				<ListItemLabelPrimary>{name}</ListItemLabelPrimary>
				<ListItemLabelSecondary>{value}</ListItemLabelSecondary>
			</ListItemLabel>
			{directoryButton}
		</ListItem>
	}
}
DirectoryEntry.propTypes = {
	path: PropTypes.string.isRequired,
	name: PropTypes.string.isRequired,
	description: PropTypes.string.isRequired,
	isProperty: PropTypes.bool.isRequired,
	isEvent: PropTypes.bool.isRequired,
	isDirectory: PropTypes.bool.isRequired,
	value: PropTypes.any,
	lastUpdate: PropTypes.number,
};
DirectoryEntry = connect(
  state => ({
    properties: state.qth.properties,
    events: state.qth.events,
  }),
  dispatch => ({
    watchProperty: path => dispatch(qth_actions.watchProperty(path)),
    watchEvent: path => dispatch(qth_actions.watchEvent(path)),
    unwatchProperty: path => dispatch(qth_actions.unwatchProperty(path)),
    unwatchEvent: path => dispatch(qth_actions.unwatchEvent(path)),
  }),
)(DirectoryEntry);


class DirectoryListing extends Component {
	componentDidMount() {
		this.props.enterDirectory(this.props.path);
	}
	componentWillUnmount() {
		this.props.leaveDirectory(this.props.path);
	}
	componentWillReceiveProps(nextProps) {
		if (nextProps.path !== this.props.path) {
			this.props.enterDirectory(nextProps.path);
			this.props.leaveDirectory(this.props.path);
		}
	}
	
	render() {
		const entries = [];
		for (const [name, registrations] of Object.entries(this.props.contents)) {
			let descriptions = [];
			let isProperty = false;
			let isEvent = false;
			let isDirectory = false;
			for (const {behaviour, description, client_id} of registrations) {
				isProperty |= behaviour.startsWith("PROPERTY-");
				isEvent |= behaviour.startsWith("EVENT-");
				isDirectory |= behaviour == "DIRECTORY";
				descriptions.push(`${description}\n(${behaviour} registered by ${client_id})`);
			}
			
			entries.push(
				<DirectoryEntry
					key={name}
					name={name}
					path={this.props.path + name}
					isProperty={!!isProperty}
					isEvent={!!isEvent}
					isDirectory={!!isDirectory}
					description={descriptions.join("\n\n")}
				/>
			);
		}
		
		return <List>{entries}</List>
	};
}

DirectoryListing = connect(
  (state, props) => ({
    contents: ((state.qth.directories[props.path] || {}).contents) || {},
  }),
  dispatch => ({
    enterDirectory: path => dispatch(qth_actions.enterDirectory(path)),
    leaveDirectory: path => dispatch(qth_actions.leaveDirectory(path)),
  }),
)(DirectoryListing);


export default DirectoryListing;

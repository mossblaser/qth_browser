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
import LoadingArea from "../../presentation/LoadingArea/index.jsx";
import ErrorMessage from "../../presentation/ErrorMessage/index.jsx";

import MdNavigateNext from "react-icons/lib/md/navigate-next";
import MdFolder from "react-icons/lib/md/folder";
import GoPrimitiveDot from "react-icons/lib/go/primitive-dot";

import {
	containsProperty,
	containsEvent,
	containsDirectory,
	directoryExists,
} from "../../qth_utils.js";

/**
 * A single DirectoryListing entry (not for external use).
 *
 * Props
 * -----
 * * path: The full, absolute path of the value to show.
 * * name: Just the name of the value (no directory or trailing slashes)
 * * description: Human readable description for tooltip.
 * * isProperty: Is it a property?
 * * isEvent: Is it an event?
 * * isDirectory: Is it a directory?
 * * onValueClick: Callback called with the full path when the value is
 *   clicked (not emitted unless one of isProperty or isEvent are true).
 * * onDirectoryClick: Callback called with the full path (and a trailing
 *   slash) when the 'enter directory' button is clicked. Only emitted when
 *   isDirectory is true.
 */
class DirectoryEntry extends Component {
	constructor(props) {
		super(props);
		this.onDefaultClick = this.onDefaultClick.bind(this);
		this.onDirectoryClick = this.onDirectoryClick.bind(this);
	}
	
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
	
	onDefaultClick(evt) {
		if (this.props.isProperty || this.props.isEvent) {
			if (this.props.onValueClick) {
				this.props.onValueClick(this.props.path);
			}
		} else if (this.props.isDirectory) {
			if (this.props.onDirectoryClick) {
				this.props.onDirectoryClick(this.props.path + "/");
			}
		}
		evt.stopPropagation();
	}
	onDirectoryClick(evt) {
		if (this.props.onDirectoryClick) {
			this.props.onDirectoryClick(this.props.path + "/");
		}
		evt.stopPropagation();
	}
	
	render() {
		const {path, isProperty, isEvent, isDirectory, description} = this.props;
		let {name} = this.props;
		
		// Represent empty names with a 'dot' (e.g. "meta/ls/" is a property).
		if (name === "") {
			name = <GoPrimitiveDot />
		}
		
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
			// By only setting the 'onClick' property for hybrid value/directory
			// entries we avoid having the arrow button have its own animation when
			// it doesn't need to. 
			directoryButton = <ListItemIcon onClick={(isProperty || isEvent)
			                                           ?  this.onDirectoryClick
			                                           : null}>
				<MdNavigateNext size={24}/>
			</ListItemIcon>;
		}
		
		return <ListItem title={description} onClick={this.onDefaultClick}> 
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
	onValueClick: PropTypes.func,
	onDirectoryClick: PropTypes.func,
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
		const directoryEntries = [];
		const otherEntries = [];
		
		const sortedContents = Object.entries(this.props.contents);
		sortedContents.sort(([a], [b]) => a > b);
		
		for (const [name, registrations] of sortedContents) {
			let isProperty = containsProperty(registrations);
			let isEvent =  containsEvent(registrations);
			let isDirectory = containsDirectory(registrations);
			
			let descriptions = [];
			for (const {behaviour, description, client_id} of registrations) {
				descriptions.push(`${description}\n(${behaviour} registered by ${client_id})`);
			}
			
			// (Pure) directories are listed before other values, accumulate these in
			// different lists.
			const entries = ((isDirectory && !(isProperty || isEvent))
			                  ? directoryEntries
			                  : otherEntries);
			entries.push(
				<DirectoryEntry
					key={name}
					name={name}
					path={this.props.path + name}
					isProperty={!!isProperty}
					isEvent={!!isEvent}
					isDirectory={!!isDirectory}
					description={descriptions.join("\n\n")}
					onValueClick={this.props.onValueClick}
					onDirectoryClick={this.props.onDirectoryClick}
				/>
			);
		}
		const directoryListing = <List>
			{directoryEntries}
			{otherEntries}
		</List>;
		
		const noDirectoryError = <ErrorMessage>
			{`Directory does not exist!`}
		</ErrorMessage>;
		
		return <LoadingArea loaded={this.props.directoryExists !== undefined}>
			{this.props.directoryExists !== false ? directoryListing : noDirectoryError}
		</LoadingArea>
	};
}
DirectoryEntry.propTypes = {
	path: PropTypes.string.isRequired,
	onValueClick: PropTypes.func,
	onDirectoryClick: PropTypes.func,
};

DirectoryListing = connect(
  (state, props) => ({
    contents: ((state.qth.directories[props.path] || {}).contents) || {},
    directoryExists: directoryExists(props.path, state.qth.directories),
  }),
  dispatch => ({
    enterDirectory: path => dispatch(qth_actions.enterDirectory(path)),
    leaveDirectory: path => dispatch(qth_actions.leaveDirectory(path)),
  }),
)(DirectoryListing);


export default DirectoryListing;

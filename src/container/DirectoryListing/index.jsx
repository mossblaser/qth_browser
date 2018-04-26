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
			let isProperty = false;
			let isEvent = false;
			let isDirectory = false;
			for (const {behaviour} of registrations) {
				isProperty |= behaviour.startsWith("PROPERTY-");
				isEvent |= behaviour.startsWith("EVENT-");
				isDirectory |= behaviour == "DIRECTORY";
			}
			
			let directoryButton = null;
			if (isDirectory) {
				directoryButton = <ListItemIcon>
					<MdNavigateNext size={24}/>
				</ListItemIcon>;
			}
			
			// If value is ambiguously a property and an event, treat it as a
			// property.
			const fullPath = this.props.path + name;
			let valueSubscription = {};
			if (isProperty) {
				valueSubscription = this.props.properties[fullPath] || {};
			} else if (isEvent) {
				valueSubscription = this.props.events[fullPath] || {};
			}
			
			const value = valueSubscription.value;
			const valueLastUpdate = valueSubscription.lastUpdate;
			
			let nameLabel = name;
			if (isDirectory) {
				if (isProperty || isEvent) {
					nameLabel = <span>{name}<span className="trailing-slash-feint">/</span></span>;
				} else {
					nameLabel = <span>{name}<span className="trailing-slash">/</span></span>;
				}
			}
			
			let icon = "?";
			let valueComponent;
			if (isProperty) {
				icon = "P";
				valueComponent = <QthPropertyValue
					value={value}
					lastUpdate={valueLastUpdate}
				/>;
			} else if (isEvent) {
				icon = "E";
				valueComponent = <QthEventValue
					value={value}
					lastUpdate={valueLastUpdate}
				/>;
			} else if (isDirectory) {
				icon = <MdFolder size={24} />;
				valueComponent = null;
			}
			
			entries.push(
				<ListItem key={name}>
					<ListItemIcon>{icon}</ListItemIcon>
					<ListItemLabel>
						<ListItemLabelPrimary>{nameLabel}</ListItemLabelPrimary>
						<ListItemLabelSecondary>
							{valueComponent}
						</ListItemLabelSecondary>
					</ListItemLabel>
					{directoryButton}
				</ListItem>
			);
		}
		
		return <List>{entries}</List>
	};
}

DirectoryListing = connect(
  (state, props) => ({
    contents: ((state.qth.directories[props.path] || {}).contents) || {},
    properties: state.qth.properties,
    events: state.qth.events,
  }),
  dispatch => ({
    enterDirectory: path => dispatch(qth_actions.enterDirectory(path)),
    leaveDirectory: path => dispatch(qth_actions.leaveDirectory(path)),
  }),
)(DirectoryListing);


export default DirectoryListing;

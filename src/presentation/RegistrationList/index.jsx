import React, { Component } from "react";
import PropTypes from "prop-types";

import {
	List,
	ListItem,
	ListItemIcon,
	ListItemLabel,
	ListItemLabelPrimary,
	ListItemLabelSecondary
} from "../../presentation/List/index.jsx";

import QthValueIcon from "../../presentation/QthValueIcon/index.jsx";
import { MdNavigateNext } from "react-icons/md";

const BehaviourScore = behaviour => {
	switch (behaviour) {
		case "DIRECTORY":
			return 0;
		
		case "PROPERTY-1:N":
		case "PROPERTY-N:1":
			return 1;
		
		case "EVENT-1:N":
		case "EVENT-N:1":
			return 2;
		
		default:
			return 3;
	}
};

const registrationCompare = (a, b) => {
	const aScore = BehaviourScore(a.behaviour);
	const bScore = BehaviourScore(b.behaviour);
	const aClientId = a.client_id;
	const bClientId = b.client_id;
	if (aScore != bScore) {
		return aScore - bScore;
	} else if (aClientId < bClientId) {
		return -1;
	} else if (aClientId == bClientId) {
		return 0;
	} else {
		return 1;
	}
};

const RegistrationList = ({registrations, path, onDirectoryClick, onValueClick}) => {
	// Sort by type, then client ID
	registrations.sort(registrationCompare);
	
	const entries = [];
	for (const registration of registrations) { 
		let heading = registration.client_id;
		let hint = "Open client registration";
		if (registration.behaviour === "DIRECTORY") {
			heading = "Directory";
			hint = "Browse directory";
		}
		
		const descriptions = [];
		descriptions.push(`Behaviour: ${registration.behaviour}`);
		descriptions.push(`Description: ${registration.description}`);
		if (registration.delete_on_unregister) {
			descriptions.push("Will be deleted on unregistration.");
		}
		if (registration.on_unregister) {
			descriptions.push(<span>
				On unregisteration
				{registration.behaviour.startsWith("PROPERTY")
				  ? " will be set to:"
				  : " will send:"}
				<code>{JSON.stringify(registration.on_unregister)}</code>
			</span>);
		}
		
		let onClick;
		if (registration.behaviour === "DIRECTORY") {
			onClick = () => onDirectoryClick(`${path}/`);
		} else {
			onClick = () => onValueClick(`meta/clients/${registration.client_id}`);
		}
		
		entries.push(<ListItem key={registration.client_id}
		                       title={hint}
		                       onClick={onClick}>
			<ListItemIcon>
				<QthValueIcon behaviour={registration.behaviour} />
			</ListItemIcon>
			<ListItemLabel>
				<ListItemLabelPrimary>
					{heading}
				</ListItemLabelPrimary>
				{descriptions.map((value, key) => (
					<ListItemLabelSecondary key={key} style={{whiteSpace: "pre-wrap"}}>
						{value}
					</ListItemLabelSecondary>
				))}
			</ListItemLabel>
			<ListItemIcon>
				<MdNavigateNext size={24} />
			</ListItemIcon>
		</ListItem>);
	}
	
	return <List>
		{entries}
	</List>
};
RegistrationList.propTypes = {
	path: PropTypes.string,
	registrations: PropTypes.arrayOf(PropTypes.object),
	onDirectoryClick: PropTypes.func,
	onValueClick: PropTypes.func,
};


export default RegistrationList;

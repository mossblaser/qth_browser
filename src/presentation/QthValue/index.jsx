import React, { Component } from "react";

import {
	Transition,
	CSSTransition,
	TransitionGroup,
} from 'react-transition-group';

import PropTypes from "prop-types";

import "./QthValue.less";

/** An app bar at the top of the display */
const QthValue = ({value, isEvent, lastUpdate}) => {
	let className;
	if (value === undefined) {
		if (isEvent) {
			// No event values known yet
			className = "QthValue-idle";
		} else {
			// Property value deleted or not yet known
			className = "QthValue-absent";
		}
	} else {
		if (isEvent) {
			// Event has a value
			className = "QthValue-event";
		} else {
			// Property has a value
			className = "QthValue-property";
		}
	}
	
	let valueText = JSON.stringify(value) || " ";
	let transitionDuration = 200; // @qth-value-change-duration
	let transitionClass = isEvent ? "event" : "property";
	let isDeleting = false;
	if (!isEvent) {
		if (value === undefined) {
			if (lastUpdate) {
				valueText = "(deleted)";
				transitionClass = "property-deleted";
				isDeleting = true;
				transitionDuration += 200; // + @qth-value-delete-duration
			} else {
				valueText = "(waiting for value)";
				transitionClass = "property-initial";
				transitionDuration += 500; // + @qth-value-initial-delay
			}
		}
	}
	
	// Don't animate value arrival for the first few ms of display since this
	// will usually only be the initial value of a property arriving.
	const animationEnableDelay = 500;
	
	return <div className="QthValue">
		<Transition timeout={animationEnableDelay} in={true} appear>{
			animationEnableStatus => (
				<TransitionGroup timeout={transitionDuration}
					               appear
				                 className={"QthValue-container"
				                            + (isDeleting ? " deleting" : "")
				                            + (animationEnableStatus==="entering" ? " disable-animation" : "")}>
					<CSSTransition timeout={transitionDuration}
					               classNames={transitionClass}
					               key={lastUpdate||0}>
						<div className="QthValue-text">{valueText}</div>
					</CSSTransition>
				</TransitionGroup>
			)
		}</Transition>
	</div>;
}
QthValue.propTypes = {
	value: PropTypes.any,
	lastUpdate: PropTypes.number,
	isEvent: PropTypes.bool,
};

export default QthValue;

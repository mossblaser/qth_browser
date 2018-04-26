import React, { Component } from "react";

import {
	Transition,
	CSSTransition,
	TransitionGroup,
} from 'react-transition-group';

import PropTypes from "prop-types";

import "./QthValue.less";

/**
 * Displays a live Qth value in a single line of text. This value animates upon
 * changes.
 *
 * Props:
 * * value: The JSON-serialisable value to be displayed (or undefined if no
 *   value available).
 * * isEvent: True if the value is a Qth Event (false if a Property).
 * * lastUpdate: The time (in ms since the epoch) since the value last changed.
 */
const QthValue = ({value, isEvent, lastUpdate}) => {
	// The text to display for the value
	let valueText = JSON.stringify(value) || " ";
	
	// The duraiton of the animation to play for the value change (ms) 
	let transitionDuration = 200; // @qth-value-change-duration
	
	// The animations used are different for different kinds of value or change.
	// This class is used by the CSS to control which animation is used.
	let transitionClass = isEvent ? "event" : "property";
	
	// Indicate that a previous value was deleted (i.e. the value has changed to
	// the deleting state).
	let isDeleting = false;
	
	// Display deleted properties explicitly
	if (!isEvent && value === undefined) {
		valueText = "(deleted)";
		if (lastUpdate) {
			// If we have a lastUpdate then this value was explicitly deleted
			isDeleting = true;
			transitionClass = "property-deleted";
			transitionDuration += 200; // + @qth-value-delete-duration
		} else {
			// If no lastValue is available this property value is just not available
			// yet. Since this will briefly be the case when we're just subscribing
			// to the value we have a distinct animation for this. This animation
			// hides the message briefly before showing the '(deleted)' message. If
			// the value subsequently arrives, the '(deleted)' message is never
			// displayed.
			transitionClass = "property-initial";
			transitionDuration += 500; // + @qth-value-initial-delay
		}
	}
	
	// The animations in use are a little complicated. The animations are as
	// follows:
	//
	// * Value changed: Previous value is immediately replaced by new value and a
	//   green flash of underline flies along the bottom of the new value.
	// * Events: After an event is recieved it fades away to nothing over the
	//   next few seconds.
	// * Properties: Properties persist and don't fade away.
	// * Property deleted: The old value is crossed out and the '(deleted)'
	//   message fades in in-front of it.
	return <div className="QthValue">
		<Transition timeout={500} in={true} appear>{
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

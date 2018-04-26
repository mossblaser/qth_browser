import React, { Component } from "react";

import {
	Transition,
	CSSTransition,
	TransitionGroup,
} from 'react-transition-group';

import PropTypes from "prop-types";

import "./QthValue.less";

// Duration of value changed animation (ms) 
// (Same as LESS: @qth-value-change-duration)
const changeAnimationDuration = 200;

/**
 * Displays a live Qth event's value in a single line of text.
 *
 * Adds a green dashing line animation to the nearest 'position: relative'
 * parent div on change. Event values fade away after a few seconds.
 *
 * Props:
 * * value: The JSON-serialisable value to be displayed (or undefined if no
 *   value available).
 * * lastUpdate: The time (in ms since the epoch) when the event last occurred
 *   or undefined if not known.
 */
class QthEventValue extends Component {
	constructor(props) {
		super(props);
		this.state = {
			creationTime: (new Date()).getTime(),
		};
	}
	
	render() {
		const {value, lastUpdate} = this.props;
		
		let text = JSON.stringify(value);
		if (value === undefined) {
			text = " ";
		}
		if (lastUpdate === undefined || lastUpdate < this.state.creationTime) {
			// Stale value, don't show it
			text = " ";
		}
		
		// The 'lastUpdate' key ensures that this div is replaced whenever the
		// event occurs thus ensuring the fade-out animation is replayed.
		return <TransitionGroup timeout={changeAnimationDuration}>
			<CSSTransition classNames="QthValue-change-animation"
			               timeout={changeAnimationDuration}
			               key={this.props.lastUpdate||0}>
				<div className="QthEventValue">
					{text}
				</div>
			</CSSTransition>
		</TransitionGroup>;
	}
};
QthEventValue.propTypes = {
	value: PropTypes.any,
	lastUpdate: PropTypes.number,
};

/**
 * Displays a live Qth property's value in a single line of text.
 *
 * Adds a green dashing line animation to the nearest 'position: relative'
 * parent div on change. When values are deleted the old value is 'crossed out'
 * before a '(deleted)' message is shown.
 *
 * If no value is provided within a short time after creation a '(deleted)'
 * message is shown. If a value is provided within this period, the value is
 * shown with no transition or animation.
 *
 * Props:
 * * value: The JSON-serialisable value to be displayed (or undefined if no
 *   value available).
 * * lastUpdate: The time (in ms since the epoch) when the property last
 *   changed or undefined if no value reports have been received.
 */
class QthPropertyValue extends Component {
	constructor(props) {
		super(props);
		this.state = {
			creationTime: (new Date()).getTime(),
		};
	}
	
	render() {
		const {value, lastUpdate} = this.props;
		
		// Only show the value if it is both present and we have actually received
		// a value. (i.e. don't show cached values).
		
		// TODO: In the future we might want to show the cached values while
		// loading...
		const text = (value === undefined || !lastUpdate)
			? "(deleted)"
			: JSON.stringify(value);
		
		// If a no value has appeared yet don't immediatley show it as '(deleted)',
		// use CSS to add a delay before this appears so that it doesn't
		// flash up before the value arrived.
		const delayAnimation = !lastUpdate;
		
		// If a value arrives in the first 'changeAnimationDuration' ms after this
		// component is created, show the value immediately without any
		// animation. This value probably only arrived late because the
		// subscription was still being set up.
		const noAnimation = (
			lastUpdate &&
			((lastUpdate - this.state.creationTime) < changeAnimationDuration)
		);
		
		// Is the value is being explicitly deleted?
		const deleteAnimation = (value === undefined) && !!lastUpdate;
		
		// Because we need to modify the animation of a div which TransitionGroup
		// has previously copied during deletion (to animate crossing it out) and
		// we can't do that, instead we add a class to the container.
		let containerClassName = "";
		if (delayAnimation) {
			containerClassName = "QthPropertyValue-delay-animation";
		} else if (noAnimation) {
			containerClassName = "QthPropertyValue-no-animation";
		} else if (deleteAnimation) {
			containerClassName = "QthPropertyValue-delete-animation";
		} else {
			containerClassName = "QthPropertyValue-normal-animation";
		}
		
		// The 'lastUpdate' key ensures that this div is replaced whenever the
		// event occurs thus ensuring the fade-out animation is replayed.
		return <TransitionGroup timeout={changeAnimationDuration}
		                        className={containerClassName}
		                        appear>
			<CSSTransition classNames="QthValue-change-animation"
			               timeout={changeAnimationDuration}
			               key={this.props.lastUpdate||0}>
				<div className="QthPropertyValue">
					{text}
				</div>
			</CSSTransition>
		</TransitionGroup>;
	}
};
QthPropertyValue.propTypes = {
	value: PropTypes.any,
	lastUpdate: PropTypes.number,
};


export {QthEventValue, QthPropertyValue};

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
 * * multiline: Show value over multiple lines (or strictly one truncated line
 *   if not true).
 * * nofade: If true, don't fade out the event value completely.
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
		
		// Select multiple or single line format
		let className = "QthEventValue";
		let text;
		if (this.props.multiline) {
			className += " QthValue-multiline";
			text = JSON.stringify(value, null, 2);
		} else {
			className += " QthValue-oneline";
			text = JSON.stringify(value);
		}
		
		// Disable fading if required
		className += this.props.nofade
			? " QthEventValue-nofade"
			: " QthEventValue-fade";
		
		if (value === undefined) {
			text = " ";
		}
		if (lastUpdate === undefined) {
			// No value, show nothing
			text = " ";
		}
		if (lastUpdate < this.state.creationTime && !this.props.nofade) {
			// Stale value, hide it if fading is enabled
			text = " ";
		}
		
		// The 'lastUpdate' key ensures that this div is replaced whenever the
		// event occurs thus ensuring the fade-out animation is replayed.
		return <TransitionGroup timeout={changeAnimationDuration} appear>
			<CSSTransition classNames="QthValue-change-animation"
			               timeout={changeAnimationDuration}
			               key={this.props.lastUpdate||0}>
				<div className={className}>
					{text}
				</div>
			</CSSTransition>
		</TransitionGroup>;
	}
};
QthEventValue.propTypes = {
	value: PropTypes.any,
	lastUpdate: PropTypes.number,
	multiline: PropTypes.bool,
	nofade: PropTypes.bool,
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
 * * multiline: Show value over multiple lines (or strictly one truncated line
 *   if not true).
 */
class QthPropertyValue extends Component {
	constructor(props) {
		super(props);
		this.state = {
			creationTime: (new Date()).getTime(),
			
			// While true allow cached values to be shown before treating the
			// proprety as deleted
			showCachedValues: true,
		};
		
		this.showCachedValuesTimeout = setTimeout(() => {
			this.setState({showCachedValues: false});
			this.showCachedValuesTimeout = null;
		}, 500);
	}
	
	componentWillUnmount() {
		if (this.showCachedValuesTimeout !== null) {
			clearTimeout(this.showCachedValuesTimeout);
		}
	}
	
	render() {
		const {value, lastUpdate} = this.props;
		
		// Only show the value if it is both present and we have actually received
		// a value. An exception: show cahced values briefly on creation to hide
		// loading time.
		const haveValidValue = (!!lastUpdate) || this.state.showCachedValues;
		
		// Select multiple or single line format
		let className = "QthPropertyValue";
		let formattedValue;
		if (this.props.multiline) {
			className += " QthValue-multiline";
			formattedValue = JSON.stringify(value, null, 2)
		} else {
			className += " QthValue-oneline";
			formattedValue = JSON.stringify(value)
		}
		
		const text = (value === undefined || !haveValidValue)
			? "(deleted)"
			: formattedValue;
		
		// If a no value has appeared yet don't immediatley show it as '(deleted)',
		// use CSS to add a delay before this appears so that it doesn't
		// flash up before the value arrived.
		const delayAnimation = !haveValidValue;
		
		// If a value arrives in the first 'changeAnimationDuration' ms after this
		// component is created, show the value immediately without any
		// animation. This value probably only arrived late because the
		// subscription was still being set up.
		const noAnimation = (
			(lastUpdate &&
			 ((lastUpdate - this.state.creationTime) < changeAnimationDuration))
		);
		
		// Is the value is being explicitly deleted?
		const deleteAnimation = (value === undefined) && haveValidValue;
		
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
				<div className={className}>
					{text}
				</div>
			</CSSTransition>
		</TransitionGroup>;
	}
};
QthPropertyValue.propTypes = {
	value: PropTypes.any,
	lastUpdate: PropTypes.number,
	multiline: PropTypes.bool,
};


export {QthEventValue, QthPropertyValue};

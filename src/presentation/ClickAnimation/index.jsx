import React, { Component } from "react";

import {CSSTransition} from 'react-transition-group';

import "./ClickAnimation.less";


/**
 * Adds an on-click animation to the contained child div.
 *
 * Make sure to set onClick on this 'ClickAnimation' component rather than the
 * child! Animations will be disabled if onClick is not set.
 */
class ClickAnimation extends Component {
	constructor(props) {
		super(props);
		
		this.state = {
			clicking: false,
		};
		
		this.triggerAnimation = this.triggerAnimation.bind(this);
	}
	
	triggerAnimation(evt) {
		this.setState({clicking: false});
		setTimeout(() => this.setState({clicking: true}), 1);
		
		if (this.props.onClick) {
			this.props.onClick(evt);
		}
	}
	
	render() {
		return <CSSTransition in={this.state.clicking}
		                      classNames="ClickAnimation"
		                      timeout={500}
		                      onClick={this.props.onClick ? this.triggerAnimation : null} >
			{this.props.children}
		</CSSTransition>;
	}
};

export default ClickAnimation;

import React, { Component } from "react";

import {CSSTransition, TransitionGroup} from 'react-transition-group';

import "./EnterLeaveAnimation.less";


// @page-transition-delay
const transitionTimeout = 200;

/**
 * Transition between full-page views. Sides either left (if go=="left") or
 * right (if go=="right").
 */
const EnterLeaveAnimation = ({children, go}) => {
	return <TransitionGroup className={`EnterLeaveAnimation go-${go}`}
	                        timeout={transitionTimeout}>
		<CSSTransition timeout={transitionTimeout} classNames="animation"
		               key={React.Children.only(children).key}>
			<div className="EnterLeaveAnimation-child"
			     >
				{children}
			</div>
		</CSSTransition>
	</TransitionGroup>
};

export default EnterLeaveAnimation;

import React, { Component } from "react";

import {CSSTransition} from "react-transition-group";

import ClickAnimation from "../ClickAnimation/index.jsx";
import KeypressToClick from "../KeypressToClick/index.jsx";

import "./OverlayMenu.less";

/**
 * A menu which slides in from the left of the screen, covering everything
 * underneath.
 */
export const OverlayMenu = ({children, visible, onDismiss}) => (
	<CSSTransition
		in={visible}
		classNames="animation"
		timeout={200}
		mountOnEnter
		unmountOnExit
	>
		<div className="OverlayMenu" onClick={e => {
			if (!onDismiss) {
				return;
			}
			
			// Delay the dismiss callback if it bubbled down from a menu entry being
			// clicked (to allow the on-click animation to play before the menu
			// disapears).
			const menuItemClicked = e.target !== e.currentTarget;
			if (menuItemClicked) {
				setTimeout(onDismiss, 200, e);
			} else {
				onDismiss(e);
			}
		}}>
			<div className="OverlayMenu-inner">
				{children}
			</div>
		</div>
	</CSSTransition>
);

/** A coloured header for the menu. */
export const OverlayMenuHeader = ({children}) => (
	<div className="OverlayMenuHeader">
		{children}
	</div>
);

/** A clickable menu item. */
export const OverlayMenuEntry = ({children, onClick}) => (
	<ClickAnimation onClick={onClick}>
		<KeypressToClick>
			<div className="OverlayMenuEntry" tabIndex={0}>
				{children}
			</div>
		</KeypressToClick>
	</ClickAnimation>
);


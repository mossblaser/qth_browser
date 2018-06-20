import React, { Component } from "react";

import ClickAnimation from "../ClickAnimation/index.jsx";
import KeypressToClick from "../KeypressToClick/index.jsx";

import "./AppBar.less";

/** An app bar at the top of the display */
export const AppBar = ({children}) => (
	<div className="AppBar">
		{children}
	</div>
);

/** An element within the AppBar. */
export const AppBarElement = ({children}) => (
	<div className="AppBarElement">
		{children}
	</div>
);

/** A button in the AppBar. */
export const AppBarButton = ({children, onClick}) => (
	<AppBarElement>
		<ClickAnimation onClick={onClick}>
			<KeypressToClick>
				<div className="AppBarButton" tabIndex={0}>
					{children}
				</div>
			</KeypressToClick>
		</ClickAnimation>
	</AppBarElement>
);

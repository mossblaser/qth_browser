import React, { Component } from "react";

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



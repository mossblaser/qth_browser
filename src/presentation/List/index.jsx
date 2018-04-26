import React, { Component } from "react";
import ReactDOM from "react-dom";

import "./List.less";

/** A list. */
export const List = ({children}) => (
	<div className="List">
		{children}
	</div>
);

/** An item in a List. */
export const ListItem = ({children, tooltip}) => (
	<div className="ListItem" tabIndex={0} title={tooltip}>
		{children}
	</div>
);

/** An icon leading the start of the list. */
export const ListItemIcon = ({children, onClick}) => (
	<div className="ListItemIcon" tabIndex={onClick ? 0 : undefined}>
		{children}
	</div>
);

/** A label in a list. */
export const ListItemLabel = ({children}) => (
	<div className="ListItemLabel">
		{children}
	</div>
);

/** Primary part of a ListItemLabel. */
export const ListItemLabelPrimary = ({children}) => (
	<div className="ListItemLabelPrimary">
		{children}
	</div>
);

/** Secondary part of a ListItemLabel. */
export const ListItemLabelSecondary = ({children}) => (
	<div className="ListItemLabelSecondary">
		{children}
	</div>
);



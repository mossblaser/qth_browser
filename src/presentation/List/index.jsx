import React, { Component } from "react";

import ClickAnimation from "../ClickAnimation/index.jsx";
import KeypressToClick from "../KeypressToClick/index.jsx";

import "./List.less";

/** A list. */
export const List = ({children}) => (
	<div className="List">
		{children}
	</div>
);

/** An item in a List. */
export const ListItem = ({children, onClick, ...props}) => (
	<ClickAnimation onClick={onClick}>
		<KeypressToClick>
			<div className="ListItem" tabIndex={onClick ? 0 : undefined} {...props}>
				{children}
			</div>
		</KeypressToClick>
	</ClickAnimation>
);

/**
 * An icon as part of a ListItem. If onClick is provided, this will be made
 * clickable and keyboard navigable.
 */
export const ListItemIcon = ({children, ...props}) => (
	<ClickAnimation {...props}>
		<KeypressToClick>
			<div className="ListItemIcon" tabIndex={props.onClick ? 0 : undefined}>
				{children}
			</div>
		</KeypressToClick>
	</ClickAnimation>
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



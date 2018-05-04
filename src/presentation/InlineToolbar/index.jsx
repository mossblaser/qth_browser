import React, { Component } from "react";
import PropTypes from "prop-types";

import ClickAnimation from "../ClickAnimation/index.jsx";

import "./InlineToolbar.less"


export const InlineToolbarButton = ({children, onClick, ...props}) => (
	<ClickAnimation onClick={onClick}>
		<div className="InlineToolbarButton" {...props}>
			{children}
		</div>
	</ClickAnimation>
);

export const InlineToolbarSpacer = () => <div className="InlineToolbarSpacer" />;

export const InlineToolbar = ({children}) => (
	<div className="InlineToolbar">
		{children}
	</div>
);


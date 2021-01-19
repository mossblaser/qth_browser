import React, { Component } from "react";

import { MdWarning } from "react-icons/md";

import "./WarningBar.less";

const WarningBar = ({children}) => (
	<div className="WarningBar">
		<div className="WarningBar-icon">
			<MdWarning size={24} />
		</div>
		<div className="WarningBar-message">
			{children}
		</div>
	</div>
);

export default WarningBar;

import React, { Component } from "react";

import { MdError } from "react-icons/md";

import "./ErrorMessage.less";

const ErrorMessage = ({children}) => (
	<div className="ErrorMessage">
		<div className="ErrorMessage-icon">
			<MdError size={48} />
		</div>
		<div className="ErrorMessage-message">
			{children}
		</div>
	</div>
);

export default ErrorMessage;

import React, { Component } from "react";
import PropTypes from "prop-types";

import "./Description.less";

const Description = ({children, ...props}) => (
	<div className="Description" {...props}>
		{children}
	</div>
);

export default Description;


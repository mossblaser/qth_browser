import React, { Component } from "react";
import PropTypes from "prop-types";

import "./SectionHeading.less";

const SectionHeading = ({children, ...props}) => (
	<div className="SectionHeading" {...props}>
		{children}
	</div>
);

export default SectionHeading;

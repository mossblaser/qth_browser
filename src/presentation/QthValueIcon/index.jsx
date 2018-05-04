import React, { Component } from "react";

import MdFolder from "react-icons/lib/md/folder";

const QthValueIcon = ({behaviour, ...props}) => {
	switch (behaviour) {
		case "DIRECTORY":
			return <MdFolder {...props} />;
		
		case "PROPERTY-1:N":
		case "PROPERTY-N:1":
			return <span>P</span>;
		
		case "EVENT-1:N":
		case "EVENT-N:1":
			return <span>E</span>;
		
		default:
			return <span>?</span>;
	}
};

export default QthValueIcon;

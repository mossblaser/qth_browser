import React, { Component } from "react";

import {allPathParts} from "../../qth_utils.js";

import ClickAnimation from "../ClickAnimation/index.jsx";
import KeypressToClick from "../KeypressToClick/index.jsx";

import { GoPrimitiveDot } from "react-icons/go";

import "./BreadcrumbBar.less";


const BreadcrumbEntry = ({name, onClick}) => {
	// Null entries (e.g. the root) should be rendered visually
	let content;
	if (name === "") {
		content = <GoPrimitiveDot size={24} />;
	} else {
		content = name;
	}
	
	return <ClickAnimation onClick={onClick}>
		<KeypressToClick>
			<div className="BreadcrumbEntry" tabIndex={0}>
				{content}
			</div>
		</KeypressToClick>
	</ClickAnimation>;
};

const BreadcrumbSlash = ({name}) => {
	return <div className="BreadcrumbSlash">
		/
	</div>;
};

/**
 * A breadcrumb bar which shows a Qth path broken down into clickable sections.
 * To be placed in the AppBar.
 *
 * Props:
 * * path: The path to be represented as a string.
 * * isDirectory: If the path represents a directory (either "" or a string
 *   ending with "/") the path will be rendered with a trailing slash. NB: If a
 *   path such as "meta/ls/" which is both a directory and a value (it is a
 *   property containing the root directory listing) when isDirectory is false,
 *   a 'dot' will be shown to represent the empty path segment.
 * * onClick: This will be called with the subpath clicked. For example, if the
 *   path is "foo/bar/baz/" and "bar" is clicked the callback will be called
 *   with "foo/bar/".
 */
const BreadcrumbBar = ({path, isDirectory, onClick}) => {
	let key = 0;
	const parts = [];
	
	parts.push(<BreadcrumbEntry
		name={""}
		key={key++}
		onClick={() => onClick("")}
	/>);
	
	const subpaths = path.split("/");
	const [lastSubpath] = subpaths.splice(subpaths.length-1, 1);
	
	let subpathsRemaining = subpaths.length;
	let pathSoFar = "";
	for (const subpath of subpaths) {
		pathSoFar += subpath + "/";
		const thisPath = pathSoFar; // To ensure this is captured!
		
		subpathsRemaining--;
		const lastPart = subpathsRemaining === 0 && isDirectory;
		
		parts.push(
			<BreadcrumbEntry
				name={subpath}
				key={key++}
				onClick={() => lastPart ? null : onClick(thisPath)}
			/>
		);
		parts.push(
			<BreadcrumbSlash key={key++}/>
		);
	}
	
	// In directories the last subpath is always empty since the path ends with
	// "/" or is empty (the root).
	if (!isDirectory) {
		parts.push(
			<BreadcrumbEntry
				name={lastSubpath}
				key={key++}
			/>
		);
	}
	
	return <div className="BreadcrumbBar">
		<div className="BreadcrumbBar-container">
			{parts}
		</div>
	</div>;
};

export default BreadcrumbBar;

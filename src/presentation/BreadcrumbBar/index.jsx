import React, { Component } from "react";

import {allPathParts} from "../../qth_utils.js";

import ClickAnimation from "../ClickAnimation/index.jsx";
import KeypressToClick from "../KeypressToClick/index.jsx";

import GoPrimitiveDot from "react-icons/lib/go/primitive-dot";

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
	
	let pathSoFar = "";
	for (const subpath of subpaths) {
		pathSoFar += subpath + "/";
		const thisPath = pathSoFar; // To ensure this is captured!
		
		parts.push(
			<BreadcrumbEntry
				name={subpath}
				key={key++}
				onClick={() => onClick(thisPath)}
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
				onClick={() => onClick(path)}
			/>
		);
	}
	
	return <div className="BreadcrumbBar">{parts}</div>;
};

export default BreadcrumbBar;

import React, { Component } from "react";

import {CSSTransition} from 'react-transition-group';

import LoadingBar from "../LoadingBar/index.jsx";

import "./LoadingArea.less";


const LoadingArea = ({children, loaded}) => (
	<div className="LoadingArea">
		{loaded ? null : <LoadingBar />}
		<CSSTransition in={!loaded} appear timeout={500} classNames="loading">
			<div className="LoadingArea-content">
				{children}
			</div>
		</CSSTransition>
	</div>
);

export default LoadingArea;

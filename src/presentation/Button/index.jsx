import React, { Component } from "react";

import ClickAnimation from "../ClickAnimation/index.jsx";
import KeypressToClick from "../KeypressToClick/index.jsx";

import "./Button.less";

/** A clickable button. */
const Button = ({children, onClick}) => (
	<div className="Button">
    <ClickAnimation onClick={onClick}>
      <KeypressToClick>
        <div className="Button-inner" tabIndex={0}>
          {children}
        </div>
      </KeypressToClick>
    </ClickAnimation>
	</div>
);

export default Button;

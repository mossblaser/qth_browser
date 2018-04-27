import React, { Component } from "react";

/**
 * Maps 'Enter' keypress events in the child component into corresponding mouse
 * events (i.e. onKeyPress -> onClick, onKeyDown -> onMouseDown, onKeyUp ->
 * onMouseUp). Other keypress events pass through as usual.
 */
class KeypressToClick extends Component {
	constructor(props) {
		super(props);
		
		// Create wrapper functions for keyboard events which translate "enter"
		// presses into the corresponding mouse events.
		for (const [keyboardCbName, mouseCbName] of [
			["onKeyPress", "onClick"],
			// NB: These aren't used anywhere and cause problems with onMouseDown
			// functions which call evt.preventDefault to prevent focus-on-click. As
			// such I've decided to disable them for now...
			//["onKeyDown", "onMouseDown"],
			//["onKeyUp", "onMouseUp"],
		]) {
			this[keyboardCbName] = evt => {
				if (evt.key == "Enter") {
					if (this.props[mouseCbName]) {
						return this.props[mouseCbName](evt);
					}
				} else {
					if (this.props[keyboardCbName]) {
						return this.props[keyboardCbName](evt);
					}
				}
			}
		}
	}
	
	render() {
		const {children, ...props} = this.props;
		return React.cloneElement(
			React.Children.only(children),
			{
				...props,
				onKeyPress: (props.onKeyPress || props.onClick) ? this.onKeyPress : null,
				onKeyDown: (props.onKeyDown || props.onMouseDown) ? this.onKeyDown : null,
				onKeyUp: (props.onKeyUp || props.onMouseUp) ? this.onKeyUp : null,
			});
	}
}

export default KeypressToClick;

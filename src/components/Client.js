import React from "react";
import Avatar from "react-avatar";

function Client({ username }) {
	return (
		<div className="client">
			<Avatar name={username} size={44} round="15px" />
			<span className="username">{username}</span>
		</div>
	);
}

export default Client;

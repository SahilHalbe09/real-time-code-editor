import React, { useEffect, useRef, useState } from "react";
import Client from "../components/Client";
import Editor from "../components/Editor";
import { initSocket } from "../socket";
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import ACTIONS from "../Actions";

function EditorPage() {
	const socketRef = useRef(null);
	const codeRef = useRef(null);
	const location = useLocation();
	const reactNavigator = useNavigate();
	const { roomId } = useParams();
	const [clients, setClients] = useState([]);

	useEffect(() => {
		const init = async () => {
			socketRef.current = await initSocket();

			socketRef.current.on("connect_error", (err) => handleErrors(err));
			socketRef.current.on("connect_failed", (err) => handleErrors(err));

			const handleErrors = (e) => {
				console.log("socket error: ", e);
				toast.error("Socket sonnection failed, try again later.");
				reactNavigator("/");
			};

			socketRef.current.emit(ACTIONS.JOIN, {
				roomId,
				username: location.state?.username,
			});

			// Listening for joined event
			socketRef.current.on(ACTIONS.JOINED, ({ clients, username, socketId }) => {
				if (username !== location.state?.username) {
					toast.success(`${username} joined the room!`);
				}

				setClients(clients);

				socketRef.current.emit(ACTIONS.SYNC_CODE, {
					code: codeRef.current,
					socketId,
				});
			});

			// Listening for disconnected event
			socketRef.current.on(ACTIONS.DISCONNECTED, ({ socketId, username }) => {
				toast.success(`${username} left the room!`);

				setClients((prev) => {
					return prev.filter((client) => client.socketId !== socketId);
				});
			});
		};

		init();

		return () => {
			socketRef.current.disconnect();
			socketRef.current.off(ACTIONS.JOINED);
			socketRef.current.off(ACTIONS.DISCONNECTED);
		};
	}, []);

	const copyRoomId = async () => {
		try {
			await navigator.clipboard.writeText(roomId);

			toast.success("RoomId copied successfully");
		} catch (error) {
			console.log("copyRoomId error: ", error);

			toast.error("Error copying RoomId");
		}
	};

	const leaveRoom = async () => {
		reactNavigator("/");
	};

	if (!location.state) {
		return <Navigate to="/" />;
	}

	return (
		<div className="mainWrap">
			<div className="aside">
				<div className="asideInner">
					<div className="logo">
						<img src="/logo.png" alt="" className="logoImg" />
					</div>
					<h3>Connected</h3>
					<div className="clientList">
						{clients.map((client) => (
							<Client key={client.socketId} username={client.username} />
						))}
					</div>
				</div>
				<button className="btn copyBtn" onClick={copyRoomId}>
					Copy Room Id
				</button>
				<button className="btn leaveBtn" onClick={leaveRoom}>
					Leave
				</button>
			</div>
			<div className="editorWrap">
				<Editor
					socketRef={socketRef}
					roomId={roomId}
					onCodeChange={(code) => {
						codeRef.current = code;
					}}
				/>
			</div>
		</div>
	);
}

export default EditorPage;

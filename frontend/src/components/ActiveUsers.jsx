import React, { useEffect, useState, useRef } from 'react';

const ActiveUsers = () => {
    const [users, setUsers] = useState([]);
    const ws = useRef(null);


    useEffect(() => {

        ws.current = new WebSocket('ws://' + window.location.host + '/ws');

        ws.current.onopen = () => {
            console.log('WebSocket connection established');
            // ws.current.send(JSON.stringify({ type: 'getUsers' })); // Request usernames immediately
            sendMessage({ type: 'getUsers' });
        };


        ws.current.onmessage = (event) => {
            console.log(event.data)
            const serverMessage = JSON.parse(event.data);
            console.log(serverMessage)
            switch (serverMessage.type) {
                case 'usernames':
                    const { usernames } = serverMessage;
                    console.log(usernames)
                    setUsers(usernames);
                    break;

                // Handle other message types as needed
                default:
                    console.warn('Unknown message type:', serverMessage.type);
                    break;


            }
        };

        ws.current.onclose = (event) => {
            console.log('WebSocket connection closed');
            sendMessage({ type: 'disconnect' })
        }



        return () => {
            if (ws.current && ws.current.readyState === WebSocket.OPEN) {
               
                ws.current.send(JSON.stringify({ type: 'disconnect' }));

                // ws.current.close(1000, "Normal closure"); 
            };
        }
    }, []);

    const sendMessage = (message) => {
        if (ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify(message));
        } else {
            console.warn('WebSocket is not open. Cannot send message:', message);
        }
    };


    return (
        <div>
            <ul>
                {(users) ? users.map((user) => (
                    <li style={{ backgroundColor: 'rgba(34, 66, 76, 0.07)', border: '3px solid rgba(194, 234, 246, 0.07)' }}>🟢 {user}</li>
                )) : (<li></li>)}

            </ul>
        </div>
    );
};

export default ActiveUsers;

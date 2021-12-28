import { Server } from 'socket.io';
import EventEmitter from 'events';

export const notificationEmitter = new EventEmitter();

export default function setSocketIO(io: Server) {
	// notificationEmitter will emit this event when a POST request is made.
	notificationEmitter.on('response', (uuid: string, body: any) => {
		io.to(uuid).emit('response', body);
	});

	io.on('connection', (socket) => {
		if (!socket.handshake.query.uuid) {
			throw new Error('UUID cannot be undefined!');
		}
		socket.join(socket.handshake.query.uuid as string);
	});
}

import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function SearchRooms() {
	const [from, setFrom] = useState('');
	const [to, setTo] = useState('');
	const [rooms, setRooms] = useState([]);
	const search = async () => {
		const { data } = await axios.get('http://localhost:4000/api/v1/rooms', { params: { from, to } });
		setRooms(data.data);
	};
	useEffect(() => {
		// initial
	}, []);
	return (
		<div className="max-w-3xl mx-auto p-4">
			<h1 className="text-2xl font-bold mb-4">Search Rooms</h1>
			<div className="flex gap-2 mb-3">
				<input className="border p-2" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
				<input className="border p-2" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
				<button onClick={search} className="bg-blue-600 text-white px-3 py-2 rounded">
					Search
				</button>
			</div>
			<ul className="space-y-2">
				{rooms.map((r) => (
					<li key={r.roomTypeId} className="border p-3 rounded bg-white flex justify-between">
						<span>{r.name}</span>
						<span className="font-mono">Available: {r.availableCount ?? r.available}</span>
					</li>
				))}
			</ul>
		</div>
	);
}



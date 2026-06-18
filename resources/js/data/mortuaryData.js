export const initialMortuaryData = {
  rows: 5,
  cols: 5,
  racks: [
    // Row 1
    { id: 'A1', status: 'occupied', occupant: 'Juan Dela Cruz', dateOccupied: '2024-03-15', position: [0, 0] },
    { id: 'A2', status: 'available', occupant: null, dateOccupied: null, position: [0, 1] },
    { id: 'A3', status: 'reserved', occupant: 'Maria Santos', dateOccupied: '2024-03-20', position: [0, 2] },
    { id: 'A4', status: 'available', occupant: null, dateOccupied: null, position: [0, 3] },
    { id: 'A5', status: 'occupied', occupant: 'Pedro Reyes', dateOccupied: '2024-03-10', position: [0, 4] },
    // Row 2
    { id: 'B1', status: 'available', occupant: null, dateOccupied: null, position: [1, 0] },
    { id: 'B2', status: 'occupied', occupant: 'Ana Garcia', dateOccupied: '2024-03-12', position: [1, 1] },
    { id: 'B3', status: 'available', occupant: null, dateOccupied: null, position: [1, 2] },
    { id: 'B4', status: 'reserved', occupant: 'Jose Santos', dateOccupied: '2024-03-25', position: [1, 3] },
    { id: 'B5', status: 'occupied', occupant: 'Maria Luna', dateOccupied: '2024-03-08', position: [1, 4] },
    // Row 3
    { id: 'C1', status: 'reserved', occupant: 'Carmen Santos', dateOccupied: '2024-03-22', position: [2, 0] },
    { id: 'C2', status: 'available', occupant: null, dateOccupied: null, position: [2, 1] },
    { id: 'C3', status: 'occupied', occupant: 'Ramon Reyes', dateOccupied: '2024-03-18', position: [2, 2] },
    { id: 'C4', status: 'available', occupant: null, dateOccupied: null, position: [2, 3] },
    { id: 'C5', status: 'reserved', occupant: 'Ana Reyes', dateOccupied: '2024-03-21', position: [2, 4] },
    // Row 4
    { id: 'D1', status: 'available', occupant: null, dateOccupied: null, position: [3, 0] },
    { id: 'D2', status: 'occupied', occupant: 'Pedro Santos', dateOccupied: '2024-03-14', position: [3, 1] },
    { id: 'D3', status: 'available', occupant: null, dateOccupied: null, position: [3, 2] },
    { id: 'D4', status: 'occupied', occupant: 'Juan Santos', dateOccupied: '2024-03-17', position: [3, 3] },
    { id: 'D5', status: 'available', occupant: null, dateOccupied: null, position: [3, 4] },
    // Row 5
    { id: 'E1', status: 'occupied', occupant: 'Luis Garcia', dateOccupied: '2024-03-19', position: [4, 0] },
    { id: 'E2', status: 'available', occupant: null, dateOccupied: null, position: [4, 1] },
    { id: 'E3', status: 'reserved', occupant: 'Rosa Martinez', dateOccupied: '2024-03-23', position: [4, 2] },
    { id: 'E4', status: 'available', occupant: null, dateOccupied: null, position: [4, 3] },
    { id: 'E5', status: 'occupied', occupant: 'Carlos Reyes', dateOccupied: '2024-03-11', position: [4, 4] },
  ]
}; 
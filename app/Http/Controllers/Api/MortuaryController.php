<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MortuaryRack;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class MortuaryController extends Controller
{
    /**
     * Get all mortuary racks
     */
    public function index(): JsonResponse
    {
        try {
            // Initialize default layout if no racks exist
            MortuaryRack::initializeDefaultLayout();
            
            $data = MortuaryRack::getAllRacksFormatted();
            $statistics = MortuaryRack::getStatistics();
            
            return response()->json([
                'success' => true,
                'data' => $data,
                'statistics' => $statistics
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch mortuary data: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get mortuary statistics
     */
    public function statistics(): JsonResponse
    {
        try {
            $statistics = MortuaryRack::getStatistics();
            
            return response()->json([
                'success' => true,
                'statistics' => $statistics
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch statistics: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get available positions for adding new racks
     */
    public function getAvailablePositions(): JsonResponse
    {
        try {
            $layout = MortuaryRack::getLayout();
            $occupiedPositions = MortuaryRack::select('position_row', 'position_col')
                ->get()
                ->map(function ($rack) {
                    return [$rack->position_row, $rack->position_col];
                })
                ->toArray();

            $availablePositions = [];
            for ($row = 0; $row < $layout['rows']; $row++) {
                for ($col = 0; $col < $layout['cols']; $col++) {
                    if (!in_array([$row, $col], $occupiedPositions)) {
                        $rackId = chr(65 + $row) . ($col + 1);
                        $availablePositions[] = [
                            'row' => $row,
                            'col' => $col,
                            'id' => $rackId
                        ];
                    }
                }
            }

            return response()->json([
                'success' => true,
                'availablePositions' => $availablePositions,
                'layout' => $layout
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch available positions: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Add a new rack to the mortuary
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'position_row' => 'required|integer|min:0|max:9',
                'position_col' => 'required|integer|min:0|max:9',
                'status' => 'nullable|in:available,occupied,reserved',
                'occupant' => 'nullable|string|max:255',
                'dateOfBirth' => 'nullable|date',
                'dateOfDeath' => 'nullable|date',
                'dateOccupied' => 'nullable|date',
                'durationYears' => 'nullable|integer|min:1|max:5',
                'notes' => 'nullable|string|max:1000'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Generate rack ID based on position
            $row = $request->position_row;
            $col = $request->position_col;
            $rackId = chr(65 + $row) . ($col + 1); // A1, A2, B1, B2, etc.

            // Check if rack already exists at this position
            $existingRack = MortuaryRack::where('position_row', $row)
                ->where('position_col', $col)
                ->first();

            if ($existingRack) {
                return response()->json([
                    'success' => false,
                    'message' => 'A rack already exists at this position'
                ], 409);
            }

            // Check if rack ID already exists
            if (MortuaryRack::find($rackId)) {
                return response()->json([
                    'success' => false,
                    'message' => 'A rack with this ID already exists'
                ], 409);
            }

            $rackData = [
                'id' => $rackId,
                'position_row' => $row,
                'position_col' => $col,
                'status' => $request->status ?? 'available',
                'duration_years' => $request->durationYears ?? 5,
                'notes' => $request->notes
            ];

            // Handle occupant and dates based on status
            if ($request->status === 'available' || !$request->status) {
                $rackData['occupant'] = null;
                $rackData['date_of_birth'] = null;
                $rackData['date_of_death'] = null;
                $rackData['date_occupied'] = null;
            } else {
                $rackData['occupant'] = $request->occupant;
                $rackData['date_of_birth'] = $request->dateOfBirth;
                $rackData['date_of_death'] = $request->dateOfDeath;
                $rackData['date_occupied'] = $request->dateOccupied;
            }

            $rack = MortuaryRack::create($rackData);
            $rack->refresh();

            return response()->json([
                'success' => true,
                'message' => 'Rack added successfully',
                'rack' => [
                    'id' => $rack->id,
                    'status' => $rack->status,
                    'occupant' => $rack->occupant,
                    'dateOfBirth' => $rack->date_of_birth ? $rack->date_of_birth->format('Y-m-d') : null,
                    'dateOfDeath' => $rack->date_of_death ? $rack->date_of_death->format('Y-m-d') : null,
                    'dateOccupied' => $rack->date_occupied ? $rack->date_occupied->format('Y-m-d') : null,
                    'durationYears' => $rack->duration_years ?? 5,
                    'position' => [$rack->position_row, $rack->position_col],
                    'notes' => $rack->notes
                ]
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to add rack: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update a specific rack
     */
    public function update(Request $request, string $id): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'status' => 'required|in:available,occupied,reserved',
                'occupant' => 'nullable|string|max:255',
                'dateOfBirth' => 'nullable|date',
                'dateOfDeath' => 'nullable|date',
                'dateOccupied' => 'nullable|date',
                'durationYears' => 'nullable|integer|min:1|max:5',
                'notes' => 'nullable|string|max:1000'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $rack = MortuaryRack::findOrFail($id);
            
            $updateData = [
                'status' => $request->status,
                'duration_years' => $request->durationYears ?? $rack->duration_years ?? 5,
                'notes' => $request->notes
            ];

            // Handle occupant and dates based on status
            if ($request->status === 'available') {
                $updateData['occupant'] = null;
                $updateData['date_of_birth'] = null;
                $updateData['date_of_death'] = null;
                $updateData['date_occupied'] = null;
            } else {
                $updateData['occupant'] = $request->occupant;
                $updateData['date_of_birth'] = $request->dateOfBirth;
                $updateData['date_of_death'] = $request->dateOfDeath;
                $updateData['date_occupied'] = $request->dateOccupied;
            }

            $rack->update($updateData);
            $rack->refresh();

            return response()->json([
                'success' => true,
                'message' => 'Rack updated successfully',
                'rack' => [
                    'id' => $rack->id,
                    'status' => $rack->status,
                    'occupant' => $rack->occupant,
                    'dateOfBirth' => $rack->date_of_birth ? $rack->date_of_birth->format('Y-m-d') : null,
                    'dateOfDeath' => $rack->date_of_death ? $rack->date_of_death->format('Y-m-d') : null,
                    'dateOccupied' => $rack->date_occupied ? $rack->date_occupied->format('Y-m-d') : null,
                    'durationYears' => $rack->duration_years ?? 5,
                    'position' => [$rack->position_row, $rack->position_col],
                    'notes' => $rack->notes
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update rack: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reset a rack to available status
     */
    public function reset(string $id): JsonResponse
    {
        try {
            $rack = MortuaryRack::findOrFail($id);
            
            $rack->update([
                'status' => 'available',
                'occupant' => null,
                'date_occupied' => null,
                'notes' => null
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Rack reset successfully',
                'rack' => [
                    'id' => $rack->id,
                    'status' => $rack->status,
                    'occupant' => null,
                    'dateOccupied' => null,
                    'position' => [$rack->position_row, $rack->position_col],
                    'notes' => null
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to reset rack: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get a specific rack
     */
    public function show(string $id): JsonResponse
    {
        try {
            $rack = MortuaryRack::findOrFail($id);
            
            return response()->json([
                'success' => true,
                'rack' => [
                    'id' => $rack->id,
                    'status' => $rack->status,
                    'occupant' => $rack->occupant,
                    'dateOccupied' => $rack->date_occupied ? $rack->date_occupied->format('Y-m-d') : null,
                    'durationYears' => $rack->duration_years ?? 5,
                    'position' => [$rack->position_row, $rack->position_col],
                    'notes' => $rack->notes
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch rack: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Permanently delete a rack
     */
    public function destroy(string $id): JsonResponse
    {
        try {
            $rack = MortuaryRack::findOrFail($id);
            $rack->delete();

            return response()->json([
                'success' => true,
                'message' => 'Rack deleted successfully',
                'id' => $id
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete rack: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Bulk update multiple racks
     */
    public function bulkUpdate(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'racks' => 'required|array',
                'racks.*.id' => 'required|string',
                'racks.*.status' => 'required|in:available,occupied,reserved',
                'racks.*.occupant' => 'nullable|string|max:255',
                'racks.*.dateOccupied' => 'nullable|date',
                'racks.*.notes' => 'nullable|string|max:1000'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $updatedRacks = [];

            foreach ($request->racks as $rackData) {
                $rack = MortuaryRack::findOrFail($rackData['id']);
                
                $updateData = [
                    'status' => $rackData['status'],
                    'notes' => $rackData['notes'] ?? null
                ];

                if ($rackData['status'] === 'available') {
                    $updateData['occupant'] = null;
                    $updateData['date_occupied'] = null;
                } else {
                    $updateData['occupant'] = $rackData['occupant'] ?? null;
                    $updateData['date_occupied'] = $rackData['dateOccupied'] ?? null;
                }

                $rack->update($updateData);
                
                $updatedRacks[] = [
                    'id' => $rack->id,
                    'status' => $rack->status,
                    'occupant' => $rack->occupant,
                    'dateOccupied' => $rack->date_occupied ? $rack->date_occupied->format('Y-m-d') : null,
                    'position' => [$rack->position_row, $rack->position_col],
                    'notes' => $rack->notes
                ];
            }

            return response()->json([
                'success' => true,
                'message' => 'Racks updated successfully',
                'racks' => $updatedRacks
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update racks: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Initialize mortuary layout (admin only)
     */
    public function initialize(): JsonResponse
    {
        try {
            // Clear existing racks
            MortuaryRack::truncate();
            
            // Initialize default layout
            MortuaryRack::initializeDefaultLayout();
            
            $data = MortuaryRack::getAllRacksFormatted();
            $statistics = MortuaryRack::getStatistics();
            
            return response()->json([
                'success' => true,
                'message' => 'Mortuary layout initialized successfully',
                'data' => $data,
                'statistics' => $statistics
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to initialize mortuary: ' . $e->getMessage()
            ], 500);
        }
    }
}
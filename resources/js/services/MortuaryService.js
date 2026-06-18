// Mortuary API Service
class MortuaryService {
    constructor() {
        this.baseUrl = '/api/staff/mortuary';
    }

    async getAuthHeaders() {
        const token = localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    }

    async getAvailablePositions() {
        try {
            const response = await fetch(`${this.baseUrl}/available-positions`, {
                method: 'GET',
                headers: await this.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching available positions:', error);
            throw error;
        }
    }

    async addRack(rackData) {
        try {
            const response = await fetch(`${this.baseUrl}/`, {
                method: 'POST',
                headers: await this.getAuthHeaders(),
                body: JSON.stringify(rackData)
            });

            const data = await response.json();

            if (!response.ok) {
                // Handle specific error cases
                if (response.status === 409) {
                    throw new Error(data.message || 'Position already occupied');
                } else if (response.status === 422) {
                    const errors = data.errors ? Object.values(data.errors).flat().join(', ') : data.message;
                    throw new Error(`Validation error: ${errors}`);
                } else {
                    throw new Error(data.message || `HTTP error! status: ${response.status}`);
                }
            }

            return data;
        } catch (error) {
            console.error('Error adding rack:', error);
            throw error;
        }
    }

    async fetchMortuaryData() {
        try {
            const response = await fetch(`${this.baseUrl}/`, {
                method: 'GET',
                headers: await this.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching mortuary data:', error);
            throw error;
        }
    }

    async getStatistics() {
        try {
            const response = await fetch(`${this.baseUrl}/statistics`, {
                method: 'GET',
                headers: await this.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching statistics:', error);
            throw error;
        }
    }

    async updateRack(rackId, updateData) {
        try {
            const response = await fetch(`${this.baseUrl}/${rackId}`, {
                method: 'PATCH',
                headers: await this.getAuthHeaders(),
                body: JSON.stringify(updateData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error updating rack:', error);
            throw error;
        }
    }

    async resetRack(rackId) {
        try {
            const response = await fetch(`${this.baseUrl}/${rackId}/reset`, {
                method: 'PATCH',
                headers: await this.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error resetting rack:', error);
            throw error;
        }
    }

    async getRack(rackId) {
        try {
            const response = await fetch(`${this.baseUrl}/${rackId}`, {
                method: 'GET',
                headers: await this.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching rack:', error);
            throw error;
        }
    }

    async bulkUpdateRacks(racksData) {
        try {
            const response = await fetch(`${this.baseUrl}/bulk-update`, {
                method: 'POST',
                headers: await this.getAuthHeaders(),
                body: JSON.stringify({ racks: racksData })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error bulk updating racks:', error);
            throw error;
        }
    }

    async initializeMortuary() {
        try {
            const response = await fetch(`${this.baseUrl}/initialize`, {
                method: 'POST',
                headers: await this.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error initializing mortuary:', error);
            throw error;
        }
    }

    async deleteRack(rackId) {
        try {
            const response = await fetch(`${this.baseUrl}/${rackId}`, {
                method: 'DELETE',
                headers: await this.getAuthHeaders()
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }
            return data;
        } catch (error) {
            console.error('Error deleting rack:', error);
            throw error;
        }
    }
}

// Export for use in components
window.MortuaryService = MortuaryService;

import React, { useState, useEffect } from 'react';
import { api } from '../../utils/axios';

const FamilyMembers = () => {
    const [familyMembers, setFamilyMembers] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFamilyMembers = async () => {
            try {
                const response = await api.get('/user/family-members');
                setFamilyMembers(response.data);
            } catch (err) {
                setError(err.response?.data?.error || 'Failed to fetch family members.');
            } finally {
                setLoading(false);
            }
        };

        fetchFamilyMembers();
    }, []);

    if (loading) {
        return <div className="text-center p-8">Loading...</div>;
    }

    if (error) {
        return <div className="text-center p-8 text-red-500">{error}</div>;
    }

    return (
        <div className="container mx-auto p-8">
            <h1 className="text-3xl font-bold mb-6">Family Members</h1>
            {familyMembers.length > 0 ? (
                <ul className="space-y-4">
                    {familyMembers.map(member => (
                        <li key={member.id} className="p-4 bg-white rounded-lg shadow">
                            <p className="font-semibold text-lg">{member.name}</p>
                            <p className="text-gray-600">{member.email}</p>
                        </li>
                    ))}
                </ul>
            ) : (
                <p>No family members found.</p>
            )}
        </div>
    );
};

export default FamilyMembers; 
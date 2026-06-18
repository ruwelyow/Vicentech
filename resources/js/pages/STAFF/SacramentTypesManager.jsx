import React, { useState, useEffect } from 'react';

const SacramentTypesManager = ({ onBack, setError }) => {
  const [sacramentTypes, setSacramentTypes] = useState([]);
  const [sacramentTypesLoading, setSacramentTypesLoading] = useState(false);
  const [newSacramentType, setNewSacramentType] = useState('');
  const [newSacramentDescription, setNewSacramentDescription] = useState('');
  const [newSacramentRequirements, setNewSacramentRequirements] = useState('');
  const [addTypeLoading, setAddTypeLoading] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [editTypeName, setEditTypeName] = useState('');
  const [editTypeDescription, setEditTypeDescription] = useState('');
  const [editTypeRequirements, setEditTypeRequirements] = useState('');

  const fetchSacramentTypes = async () => {
    setSacramentTypesLoading(true);
    try {
      const response = await fetch('/api/staff/sacrament-types', {
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to fetch sacrament types');
      const data = await response.json();
      setSacramentTypes(data);
    } catch (err) {
      setError && setError(err.message);
    } finally {
      setSacramentTypesLoading(false);
    }
  };

  useEffect(() => { fetchSacramentTypes(); }, []);

  const handleAddSacramentType = async (e) => {
    e.preventDefault();
    if (!newSacramentType.trim()) return;
    setAddTypeLoading(true);
    try {
      const response = await fetch('/api/staff/sacrament-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newSacramentType, description: newSacramentDescription, requirements: newSacramentRequirements }),
      });
      if (!response.ok) throw new Error('Failed to add sacrament type');
      setNewSacramentType('');
      setNewSacramentDescription('');
      setNewSacramentRequirements('');
      await fetchSacramentTypes();
    } catch (err) {
      setError && setError(err.message);
    } finally {
      setAddTypeLoading(false);
    }
  };

  const handleEditSacramentType = async (id) => {
    if (!editTypeName.trim()) return;
    try {
      const response = await fetch(`/api/staff/sacrament-types/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editTypeName, description: editTypeDescription, requirements: editTypeRequirements }),
      });
      if (!response.ok) throw new Error('Failed to update sacrament type');
      setEditingType(null);
      setEditTypeName('');
      setEditTypeDescription('');
      setEditTypeRequirements('');
      await fetchSacramentTypes();
    } catch (err) {
      setError && setError(err.message);
    }
  };

  const handleDeleteSacramentType = async (id) => {
    try {
      const response = await fetch(`/api/staff/sacrament-types/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to delete sacrament type');
      await fetchSacramentTypes();
    } catch (err) {
      setError && setError(err.message);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow border border-[#f2e4ce] p-6">
      <h2 className="text-xl font-bold text-[#3F2E1E] mb-4">Manage Sacrament Types</h2>
      <p className="text-[#5C4B38] mb-4">Add, edit, or remove sacrament types</p>
      <form onSubmit={handleAddSacramentType} className="mb-6">
        <div className="space-y-3">
          <div className="flex gap-3">
            <input 
              type="text" 
              value={newSacramentType} 
              onChange={e => setNewSacramentType(e.target.value)} 
              placeholder="Enter sacrament type name" 
              className="flex-1 px-4 py-2 border border-[#f2e4ce] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#806c4b] focus:border-transparent" 
              disabled={addTypeLoading} 
            />
            <button 
              type="submit" 
              disabled={addTypeLoading || !newSacramentType.trim()} 
              className="px-6 py-2 bg-[#806c4b] text-white rounded-lg font-semibold hover:bg-[#6b5a3f] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {addTypeLoading ? 'Adding...' : 'Add Type'}
            </button>
          </div>
          <div>
            <textarea
              value={newSacramentDescription}
              onChange={e => setNewSacramentDescription(e.target.value)}
              placeholder="Enter description (optional)"
              className="w-full px-4 py-2 border border-[#f2e4ce] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#806c4b] focus:border-transparent resize-vertical"
              rows="3"
              disabled={addTypeLoading}
            />
          </div>
          <div>
            <textarea
              value={newSacramentRequirements}
              onChange={e => setNewSacramentRequirements(e.target.value)}
              placeholder="Enter requirements (one per line, optional)"
              className="w-full px-4 py-2 border border-[#f2e4ce] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#806c4b] focus:border-transparent resize-vertical"
              rows="4"
              disabled={addTypeLoading}
            />
          </div>
        </div>
      </form>
      {sacramentTypesLoading ? (
        <div className="text-center py-8"><p className="text-[#5C4B38]">Loading sacrament types...</p></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#f2e4ce]">
            <thead className="bg-[#FFF6E5]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#3F2E1E] uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#3F2E1E] uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#3F2E1E] uppercase tracking-wider">Requirements</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#3F2E1E] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[#f2e4ce]">
              {sacramentTypes.map(type => (
                <tr key={type.id} className="hover:bg-[#f9f6f1] transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#3F2E1E]">
                    {editingType === type.id ? (
                      <input type="text" value={editTypeName} onChange={e => setEditTypeName(e.target.value)} className="w-full px-3 py-1 border border-[#f2e4ce] rounded focus:outline-none focus:ring-2 focus:ring-[#806c4b]" />
                    ) : type.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-[#3F2E1E]">
                    {editingType === type.id ? (
                      <input type="text" value={editTypeDescription} onChange={e => setEditTypeDescription(e.target.value)} className="w-full px-3 py-1 border border-[#f2e4ce] rounded focus:outline-none focus:ring-2 focus:ring-[#806c4b]" />
                    ) : (type.description || 'No description')}
                  </td>
                  <td className="px-6 py-4 text-sm text-[#3F2E1E]">
                    {editingType === type.id ? (
                      <textarea value={editTypeRequirements} onChange={e => setEditTypeRequirements(e.target.value)} className="w-full px-3 py-1 border border-[#f2e4ce] rounded focus:outline-none focus:ring-2 focus:ring-[#806c4b] resize-vertical" rows="3" />
                    ) : (type.requirements ? type.requirements.split('\n').map((req, index) => (
                      <div key={index} className="mb-1">• {req}</div>
                    )) : 'No requirements')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {editingType === type.id ? (
                      <div className="flex gap-2">
                        <button onClick={() => handleEditSacramentType(type.id)} className="text-green-600 hover:text-green-800 font-semibold">Save</button>
                        <button onClick={() => { setEditingType(null); setEditTypeName(''); setEditTypeDescription(''); setEditTypeRequirements(''); }} className="text-gray-600 hover:text-gray-800 font-semibold">Cancel</button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setEditingType(type.id); setEditTypeName(type.name); setEditTypeDescription(type.description || ''); setEditTypeRequirements(type.requirements || ''); }}
                          className="text-blue-600 hover:text-blue-800 font-semibold"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteSacramentType(type.id)}
                          className="text-red-600 hover:text-red-800 font-semibold"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SacramentTypesManager; 
import React, { useState, useEffect } from 'react';
import { fireMessage } from './AuthPage/Signup';
import Swal from 'sweetalert2';

const api_url = process.env.REACT_APP_API_URL;

const BtsSchemaManager = () => {
  const [roles, setRoles] = useState([]);
  const [newRole, setNewRole] = useState({ title: '', key: '' });

  // Fetch BTS schema on mount
  useEffect(() => {
    fetchBtsSchema();
  }, []);

  const fetchBtsSchema = async () => {
    try {
      const response = await fetch(`${api_url}/api/bts-schema`, {
        method: 'GET',
        credentials: 'include'
      });
      const data = await response.json();
      if (response.ok) {
        setRoles(data.schema);
      } else {
        fireMessage(data.message, 'error');
      }
    } catch (error) {
      fireMessage(error.message, 'error');
    }
  };

  // Add role handler
  const handleAddRole = async () => {
    if (!newRole.title || !newRole.key) {
      return fireMessage('Both title and key are required', 'error');
    }

    try {
      const response = await fetch(`${api_url}/api/bts-schema`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRole),
        credentials: 'include'
      });

      if (response.ok) {
        const newRoleData = await response.json();
        setRoles([...roles, newRoleData.role]);
        setNewRole({ title: '', key: '' });
        fireMessage('Role added successfully', 'success');
      } else {
        const errorData = await response.json();
        fireMessage(errorData.message, 'error');
      }
    } catch (error) {
      fireMessage(error.message, 'error');
    }
  };

  // Delete role handler
  const handleDeleteRole = async (roleId) => {
    try {
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it!'
      });

      if (result.isConfirmed) {
        const response = await fetch(`${api_url}/api/bts-schema/${roleId}`, {
          method: 'DELETE',
          credentials: 'include'
        });

        if (response.ok) {
          setRoles(roles.filter(role => role._id !== roleId));
          Swal.fire('Deleted!', 'The role has been deleted.', 'success');
        } else {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to delete role');
        }
      }
    } catch (error) {
      Swal.fire('Error!', error.message || 'Something went wrong!', 'error');
    }
  };

  return (
    <div className="bts-schema-manager p-4">
      <h2 className="text-xl font-bold mb-4">BTS Roles Schema</h2>

      <div className="add-role-form flex gap-2 mb-6">
        <input
          type="text"
          placeholder="Role Title (e.g., Drone Pilot)"
          className="flex-1 p-2 border rounded"
          value={newRole.title}
          onChange={(e) => setNewRole({ ...newRole, title: e.target.value })}
        />
        <input
          type="text"
          placeholder="Team member name"
          className="flex-1 p-2 border rounded"
          value={newRole.key}
          onChange={(e) => setNewRole({ ...newRole, key: e.target.value })}
        />
        <button
          onClick={handleAddRole}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Add Role
        </button>
      </div>

      <div className="roles-list grid grid-cols-2 gap-4">
        {roles.map((role) => (
          <div key={role._id} className="role-item p-3 border rounded flex justify-between items-center">
            <div>
              <h3 className="font-semibold">{role.title}</h3>
              <p className="text-sm text-gray-600">{role.key}</p>
            </div>
            <button
              onClick={() => handleDeleteRole(role._id)}
              className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 transition-colors"
              title="Delete role"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BtsSchemaManager;

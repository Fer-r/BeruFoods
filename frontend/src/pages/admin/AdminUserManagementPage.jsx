import { useState, useEffect, useCallback } from 'react';
import { fetchDataFromEndpoint, deleteFromAPI, putToAPI } from '../../services/useApiService'; // Added putToAPI for later use

// Modal component using DaisyUI
const Modal = ({ isOpen, onClose, title, children }) => {
  return (
    <dialog className={`modal ${isOpen ? 'modal-open' : ''}`}>
      <div className="modal-box w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">{title}</h3>
          <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost">✕</button>
        </div>
        {children}
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  );
};


const AdminUserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [editFormData, setEditFormData] = useState({ email: '', roles: '' });
  
  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });

  const fetchUsers = useCallback(async (page = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      // Admin actions typically require authentication
      const data = await fetchDataFromEndpoint(`/users?page=${page}&limit=${pagination.itemsPerPage}`, 'GET', null, true);
      // Backend returns paginated data: {items: [...], pagination: {...}}
      setUsers(data?.items || []);
      if (data?.pagination) {
        setPagination(prev => ({
          ...prev,
          currentPage: data.pagination.currentPage || page,
          totalPages: data.pagination.totalPages || 1,
          totalItems: data.pagination.totalItems || 0
        }));
      }
    } catch (err) {
      setError(err.message);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.itemsPerPage]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleOpenEditModal = (user) => {
    setCurrentUser(user);
    setEditFormData({
      email: user.email,
      roles: (user.roles || []).join(','), // Convert array to comma-separated string for input
    });
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setCurrentUser(null);
  };

  const handleEditFormChange = (e) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    // Basic validation
    if (!editFormData.email.trim()) {
        alert("Email cannot be empty.");
        return;
    }

    const updatedUserData = {
      email: editFormData.email,
      // Convert comma-separated string back to array of roles
      // Ensure roles are trimmed and no empty strings are included
      roles: editFormData.roles.split(',').map(role => role.trim()).filter(role => role),
    };

    try {
      await putToAPI(`/users/${currentUser.id}`, updatedUserData);
      handleCloseEditModal();
      fetchUsers(pagination.currentPage); // Refresh users list with current page
    } catch (err) {
      setError(err.message); // Show error to user, maybe in the modal
      alert(`Failed to update user: ${err.message}`);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to ban this user? This action is a soft delete.')) {
      try {
        await deleteFromAPI(`/users/${userId}`); // deleteFromAPI implies authenticated
        fetchUsers(pagination.currentPage); // Refresh the list with current page
      } catch (err) {
        setError(err.message);
        alert(`Failed to ban user: ${err.message}`);
      }
    }
  };

  const handlePageChange = (page) => {
    fetchUsers(page);
  };

  if (isLoading) return <div className="container mx-auto p-4 text-center"><span className="loading loading-spinner loading-lg"></span><p>Loading users...</p></div>;
  if (error && !isEditModalOpen) return <div className="container mx-auto p-4 text-center"><div className="alert alert-error"><span>Error: {error}</span></div></div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">User Management</h1>
      {users.length > 0 ? (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body p-0">
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Email</th>
                    <th>Roles</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="font-bold">{user.id}</td>
                      <td>{user.email}</td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {(user.roles || []).map((role) => (
                            <span key={role} className="badge badge-outline badge-sm">{role}</span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleOpenEditModal(user)}
                            className="btn btn-primary btn-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="btn btn-error btn-sm"
                          >
                            Ban
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        !isLoading && <div className="text-center"><div className="alert alert-info"><span>No users found.</span></div></div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <div className="join">
            <button 
              className={`join-item btn ${pagination.currentPage === 1 ? 'btn-disabled' : ''}`}
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
            >
              «
            </button>
            
            {/* Page numbers */}
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                className={`join-item btn ${pagination.currentPage === page ? 'btn-active' : ''}`}
                onClick={() => handlePageChange(page)}
              >
                {page}
              </button>
            ))}
            
            <button 
              className={`join-item btn ${pagination.currentPage === pagination.totalPages ? 'btn-disabled' : ''}`}
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
            >
              »
            </button>
          </div>
        </div>
      )}

      {/* Pagination Info */}
      {pagination.totalItems > 0 && (
        <div className="text-center mt-2 text-sm opacity-70">
          Showing {users.length} of {pagination.totalItems} users
        </div>
      )}

      <Modal isOpen={isEditModalOpen} onClose={handleCloseEditModal} title="Edit User">
        {currentUser && (
          <form onSubmit={handleUpdateUser} className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Email</span>
              </label>
              <input
                type="email"
                name="email"
                value={editFormData.email}
                onChange={handleEditFormChange}
                className="input input-bordered w-full"
                placeholder="user@example.com"
                required
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Roles</span>
              </label>
              <input
                type="text"
                name="roles"
                value={editFormData.roles}
                onChange={handleEditFormChange}
                className="input input-bordered w-full"
                placeholder="e.g., ROLE_USER,ROLE_ADMIN"
              />
              <label className="label">
                <span className="label-text-alt">Separate multiple roles with commas</span>
              </label>
            </div>
            {error && isEditModalOpen && (
              <div className="alert alert-error">
                <span>{error}</span>
              </div>
            )}
            <div className="modal-action">
              <button
                type="button"
                onClick={handleCloseEditModal}
                className="btn btn-ghost"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
              >
                Save Changes
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default AdminUserManagementPage;

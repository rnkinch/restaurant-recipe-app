import React, { useState, useEffect } from 'react';
import { getUsers, getUserReport, createUser, updateUser, deleteUser } from './api';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'user',
    isActive: true
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await getUserReport();
      setUsers(response.users);
      setStats(response.stats);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await createUser(formData);
      setShowCreateForm(false);
      setFormData({ username: '', password: '', role: 'user', isActive: true });
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create user');
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      await updateUser(editingUser._id, formData);
      setEditingUser(null);
      setFormData({ username: '', password: '', role: 'user', isActive: true });
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteUser(userId);
        fetchUsers();
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to delete user');
      }
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '',
      role: user.role,
      isActive: user.isActive
    });
  };

  const getRoleBadge = (role) => {
    const badges = {
      admin: 'danger',
      user: 'primary',
      readonly: 'secondary'
    };
    return badges[role] || 'secondary';
  };

  const getStatusBadge = (isActive) => {
    return isActive ? 'success' : 'danger';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center p-4">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>👥 User Management</h2>
            <button 
              className="btn btn-primary"
              onClick={() => setShowCreateForm(true)}
            >
              ➕ Add User
            </button>
          </div>

          {/* Statistics Cards */}
          <div className="row mb-4">
            <div className="col-md-2">
              <div className="card text-center">
                <div className="card-body">
                  <h5 className="card-title text-primary">{stats.totalUsers || 0}</h5>
                  <p className="card-text">Total Users</p>
                </div>
              </div>
            </div>
            <div className="col-md-2">
              <div className="card text-center">
                <div className="card-body">
                  <h5 className="card-title text-success">{stats.activeUsers || 0}</h5>
                  <p className="card-text">Active Users</p>
                </div>
              </div>
            </div>
            <div className="col-md-2">
              <div className="card text-center">
                <div className="card-body">
                  <h5 className="card-title text-danger">{stats.adminUsers || 0}</h5>
                  <p className="card-text">Admins</p>
                </div>
              </div>
            </div>
            <div className="col-md-2">
              <div className="card text-center">
                <div className="card-body">
                  <h5 className="card-title text-info">{stats.regularUsers || 0}</h5>
                  <p className="card-text">Regular Users</p>
                </div>
              </div>
            </div>
            <div className="col-md-2">
              <div className="card text-center">
                <div className="card-body">
                  <h5 className="card-title text-warning">{stats.recentUsers || 0}</h5>
                  <p className="card-text">Recent (7 days)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Create/Edit User Modal */}
          {(showCreateForm || editingUser) && (
            <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
              <div className="modal-dialog">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">
                      {editingUser ? 'Edit User' : 'Create New User'}
                    </h5>
                    <button 
                      type="button" 
                      className="btn-close"
                      onClick={() => {
                        setShowCreateForm(false);
                        setEditingUser(null);
                        setFormData({ username: '', password: '', role: 'user', isActive: true });
                      }}
                    ></button>
                  </div>
                  <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser}>
                    <div className="modal-body">
                      <div className="mb-3">
                        <label className="form-label">Username</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.username}
                          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Password</label>
                        <input
                          type="password"
                          className="form-control"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          required={!editingUser}
                          placeholder={editingUser ? "Leave blank to keep current password" : ""}
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Role</label>
                        <select
                          className="form-select"
                          value={formData.role}
                          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        >
                          <option value="user">User (Can Edit)</option>
                          <option value="admin">Admin (Full Access)</option>
                          <option value="readonly">Read-Only (View Only)</option>
                        </select>
                      </div>
                      <div className="mb-3">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={formData.isActive}
                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                          />
                          <label className="form-check-label">Active User</label>
                        </div>
                      </div>
                    </div>
                    <div className="modal-footer">
                      <button type="button" className="btn btn-secondary" onClick={() => {
                        setShowCreateForm(false);
                        setEditingUser(null);
                        setFormData({ username: '', password: '', role: 'user', isActive: true });
                      }}>
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-primary">
                        {editingUser ? 'Update User' : 'Create User'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
              <button 
                type="button" 
                className="btn-close" 
                onClick={() => setError(null)}
              ></button>
            </div>
          )}

          {/* Users Table */}
          <div className="card">
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Username</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Last Login</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user._id}>
                        <td>
                          <strong>{user.username}</strong>
                          {user.firstName && user.lastName && (
                            <div className="text-muted small">
                              {user.firstName} {user.lastName}
                            </div>
                          )}
                        </td>
                        <td>
                          <span className={`badge bg-${getRoleBadge(user.role)}`}>
                            {user.role}
                          </span>
                        </td>
                        <td>
                          <span className={`badge bg-${getStatusBadge(user.isActive)}`}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>{formatDate(user.createdAt)}</td>
                        <td>
                          {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                        </td>
                        <td>
                          <div className="btn-group" role="group">
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => handleEditUser(user)}
                            >
                              ✏️ Edit
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDeleteUser(user._id)}
                              disabled={user.role === 'admin' && stats.adminUsers <= 1}
                            >
                              🗑️ Delete
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
        </div>
      </div>
    </div>
  );
};

export default UserManagement;

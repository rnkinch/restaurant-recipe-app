import React, { useState, useEffect } from 'react';
import { getUserReport } from './api';

const UserReport = () => {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUserReport = async () => {
    try {
      setLoading(true);
      const response = await getUserReport();
      setUsers(response.users);
      setStats(response.stats);
    } catch (err) {
      console.error('Error fetching user report:', err);
      setError('Failed to fetch user report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserReport();
  }, []);

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

  const exportToCSV = () => {
    const csvContent = [
      ['Username', 'Role', 'Status', 'Created', 'Last Login'].join(','),
      ...users.map(user => [
        user.username,
        user.role,
        user.isActive ? 'Active' : 'Inactive',
        formatDate(user.createdAt),
        user.lastLogin ? formatDate(user.lastLogin) : 'Never'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `user-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
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
            <h2>👥 User Report</h2>
            <button 
              className="btn btn-success"
              onClick={exportToCSV}
            >
              📊 Export CSV
            </button>
          </div>

          {/* Statistics Cards - Compact Horizontal Layout */}
          <div className="row mb-3">
            <div className="col-12">
              <div className="card bg-light border-0">
                <div className="card-body py-2">
                  <div className="row text-center">
                    <div className="col-md-2">
                      <div className="d-flex flex-column align-items-center">
                        <span className="h5 text-primary mb-0">{stats.totalUsers || 0}</span>
                        <small className="text-muted">Total Users</small>
                      </div>
                    </div>
                    <div className="col-md-2">
                      <div className="d-flex flex-column align-items-center">
                        <span className="h5 text-success mb-0">{stats.activeUsers || 0}</span>
                        <small className="text-muted">Active Users</small>
                      </div>
                    </div>
                    <div className="col-md-2">
                      <div className="d-flex flex-column align-items-center">
                        <span className="h5 text-danger mb-0">{stats.adminUsers || 0}</span>
                        <small className="text-muted">Administrators</small>
                      </div>
                    </div>
                    <div className="col-md-2">
                      <div className="d-flex flex-column align-items-center">
                        <span className="h5 text-info mb-0">{stats.regularUsers || 0}</span>
                        <small className="text-muted">Regular Users</small>
                      </div>
                    </div>
                    <div className="col-md-2">
                      <div className="d-flex flex-column align-items-center">
                        <span className="h5 text-secondary mb-0">{stats.readonlyUsers || 0}</span>
                        <small className="text-muted">Read-Only Users</small>
                      </div>
                    </div>
                    <div className="col-md-2">
                      <div className="d-flex flex-column align-items-center">
                        <span className="h5 text-warning mb-0">{stats.recentUsers || 0}</span>
                        <small className="text-muted">Recent (7 days)</small>
                      </div>
                    </div>
                    <div className="col-md-2">
                      <div className="d-flex flex-column align-items-center">
                        <span className="h5 text-dark mb-0">{stats.inactiveUsers || 0}</span>
                        <small className="text-muted">Inactive Users</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Horizontal Rule for Separation */}
          <hr className="my-3" />

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

          {/* Users Report Table */}
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">📋 User Access Report</h5>
              <small className="text-muted">All users with login access to the system</small>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead className="table-dark">
                    <tr>
                      <th>Username</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Created Date</th>
                      <th>Last Login</th>
                      <th>Login Count</th>
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
                            {user.role.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <span className={`badge bg-${getStatusBadge(user.isActive)}`}>
                            {user.isActive ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </td>
                        <td>
                          <span className="text-muted">
                            {formatDate(user.createdAt)}
                          </span>
                        </td>
                        <td>
                          {user.lastLogin ? (
                            <span className="text-success">
                              {formatDate(user.lastLogin)}
                            </span>
                          ) : (
                            <span className="text-muted">Never</span>
                          )}
                        </td>
                        <td>
                          <span className="badge bg-secondary">
                            {user.loginCount || 0}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary Information */}
              <div className="mt-4">
                <div className="row">
                  <div className="col-md-6">
                    <h6>📊 Summary</h6>
                    <ul className="list-unstyled">
                      <li><strong>Total Users:</strong> {stats.totalUsers || 0}</li>
                      <li><strong>Active Users:</strong> {stats.activeUsers || 0}</li>
                      <li><strong>Administrators:</strong> {stats.adminUsers || 0}</li>
                      <li><strong>Regular Users:</strong> {stats.regularUsers || 0}</li>
                    </ul>
                  </div>
                  <div className="col-md-6">
                    <h6>📈 Activity</h6>
                    <ul className="list-unstyled">
                      <li><strong>Recent Users (7 days):</strong> {stats.recentUsers || 0}</li>
                      <li><strong>Inactive Users:</strong> {stats.inactiveUsers || 0}</li>
                      <li><strong>Report Generated:</strong> {new Date().toLocaleString()}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserReport;

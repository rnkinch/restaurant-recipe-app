import React, { useState, useEffect } from 'react';
import { getChangeLogs } from './api';

const ChangeLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    days: 14,
    action: '',
    user: '',
    recipe: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  });

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        days: filters.days,
        ...(filters.action && { action: filters.action }),
        ...(filters.user && { user: filters.user }),
        ...(filters.recipe && { recipe: filters.recipe })
      });

      const response = await getChangeLogs({
        page: pagination.page,
        limit: pagination.limit,
        days: filters.days,
        ...(filters.action && { action: filters.action }),
        ...(filters.user && { user: filters.user }),
        ...(filters.recipe && { recipe: filters.recipe })
      });
      setLogs(response.logs);
      setPagination(response.pagination);
    } catch (err) {
      console.error('Error fetching change logs:', err);
      setError('Failed to fetch change logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [pagination.page, filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const getActionColor = (action) => {
    const colors = {
      created: 'success',
      updated: 'warning',
      deleted: 'danger',
      viewed: 'info',
      image_uploaded: 'primary',
      image_removed: 'secondary'
    };
    return colors[action] || 'secondary';
  };

  const getActionIcon = (action) => {
    const icons = {
      created: '➕',
      updated: '✏️',
      deleted: '🗑️',
      viewed: '👁️',
      image_uploaded: '📷',
      image_removed: '🖼️'
    };
    return icons[action] || '📝';
  };

  const renderValue = (value) => {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        return `[${value.length} items]`;
      }
      return '[Object]';
    }
    if (typeof value === 'string' && value.length > 50) {
      return `"${value.substring(0, 50)}..."`;
    }
    return `"${value}"`;
  };

  const renderChanges = (changes) => {
    if (!changes) return null;
    
    return (
      <div className="mt-2">
        <small className="text-muted">Changes:</small>
        <ul className="list-unstyled small">
          {Object.entries(changes).map(([field, change]) => (
            <li key={field}>
              <strong>{field}:</strong> 
              <span className="text-muted"> {renderValue(change.from)}</span> → 
              <span className="text-success"> {renderValue(change.to)}</span>
            </li>
          ))}
        </ul>
      </div>
    );
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
            <h2>📋 Change Log</h2>
            <div className="text-muted">
              Showing last {filters.days} days
            </div>
          </div>

          {/* Filters */}
          <div className="card mb-4">
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-3">
                  <label className="form-label">Days</label>
                  <select 
                    className="form-select"
                    value={filters.days}
                    onChange={(e) => handleFilterChange('days', e.target.value)}
                  >
                    <option value={7}>Last 7 days</option>
                    <option value={14}>Last 14 days</option>
                    <option value={30}>Last 30 days</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label">Action</label>
                  <select 
                    className="form-select"
                    value={filters.action}
                    onChange={(e) => handleFilterChange('action', e.target.value)}
                  >
                    <option value="">All Actions</option>
                    <option value="created">Created</option>
                    <option value="updated">Updated</option>
                    <option value="deleted">Deleted</option>
                    <option value="viewed">Viewed</option>
                    <option value="image_uploaded">Image Uploaded</option>
                    <option value="image_removed">Image Removed</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label">User</label>
                  <input 
                    type="text"
                    className="form-control"
                    placeholder="Filter by username"
                    value={filters.user}
                    onChange={(e) => handleFilterChange('user', e.target.value)}
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label">Recipe</label>
                  <input 
                    type="text"
                    className="form-control"
                    placeholder="Filter by recipe name"
                    value={filters.recipe}
                    onChange={(e) => handleFilterChange('recipe', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Change Log Table */}
          <div className="card">
            <div className="card-body">
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              {logs.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted">No change logs found for the selected criteria.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Timestamp</th>
                        <th>User</th>
                        <th>Recipe</th>
                        <th>Action</th>
                        <th>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log) => (
                        <tr key={log._id}>
                          <td>
                            <small className="text-muted">
                              {formatTimestamp(log.timestamp)}
                            </small>
                          </td>
                          <td>
                            <strong>{log.username}</strong>
                          </td>
                          <td>
                            <span className="text-primary">{log.recipeName}</span>
                          </td>
                          <td>
                            <span className={`badge bg-${getActionColor(log.action)}`}>
                              {getActionIcon(log.action)} {log.action}
                            </span>
                          </td>
                          <td>
                            {renderChanges(log.changes)}
                            {log.ipAddress && (
                              <small className="text-muted d-block">
                                IP: {log.ipAddress}
                              </small>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {pagination.pages > 1 && (
                <nav aria-label="Change log pagination">
                  <ul className="pagination justify-content-center">
                    <li className={`page-item ${pagination.page === 1 ? 'disabled' : ''}`}>
                      <button 
                        className="page-link"
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                      >
                        Previous
                      </button>
                    </li>
                    
                    {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <li key={pageNum} className={`page-item ${pagination.page === pageNum ? 'active' : ''}`}>
                          <button 
                            className="page-link"
                            onClick={() => handlePageChange(pageNum)}
                          >
                            {pageNum}
                          </button>
                        </li>
                      );
                    })}
                    
                    <li className={`page-item ${pagination.page === pagination.pages ? 'disabled' : ''}`}>
                      <button 
                        className="page-link"
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.pages}
                      >
                        Next
                      </button>
                    </li>
                  </ul>
                </nav>
              )}

              <div className="text-center text-muted">
                Showing {logs.length} of {pagination.total} entries
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangeLog;

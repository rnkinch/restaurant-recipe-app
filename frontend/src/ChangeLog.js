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
      image_uploaded: '📷',
      image_removed: '🖼️'
    };
    return icons[action] || '📝';
  };

  const renderValue = (value, fieldName = '') => {
    // Debug logging
    console.log('renderValue called with:', { value, fieldName, type: typeof value });
    
    if (value === null || value === undefined) return <span className="text-muted">(empty)</span>;
    
    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        // Handle different types of arrays based on field name
        if (fieldName === 'ingredients' && value.length > 0) {
          return (
            <div>
              <div className="small text-muted mb-1">Ingredients ({value.length} items):</div>
              <ul className="list-unstyled small">
                {value.map((ingredient, index) => {
                  // Handle the resolved ingredient data structure
                  const ingredientName = ingredient.ingredient?.name || 
                                       ingredient.name || 
                                       ingredient.ingredient || 
                                       'Unknown ingredient';
                  const quantity = ingredient.quantity || '0';
                  const unit = ingredient.measure || ingredient.unit || 'units';
                  
                  return (
                    <li key={index} className="mb-1">
                      <strong>{ingredientName}</strong> - 
                      <span className="text-muted"> {quantity} {unit}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        }
        
        if (fieldName === 'steps' && value.length > 0) {
          return (
            <div>
              <div className="small text-muted mb-1">Steps ({value.length} items):</div>
              <ol className="small">
                {value.map((step, index) => (
                  <li key={index} className="mb-1">{step}</li>
                ))}
              </ol>
            </div>
          );
        }
        
        if ((fieldName === 'allergens' || fieldName === 'serviceTypes') && value.length > 0) {
          return (
            <div>
              <div className="small text-muted mb-1">{fieldName === 'allergens' ? 'Allergens' : 'Service Types'} ({value.length} items):</div>
              <div className="small">
                {value.map((item, index) => (
                  <span key={index} className="badge bg-secondary me-1 mb-1">{item}</span>
                ))}
              </div>
            </div>
          );
        }
        
        // Generic array handling
        if (value.length === 0) {
          return <span className="text-muted">(empty list)</span>;
        }
        
        return (
          <div>
            <div className="small text-muted mb-1">List ({value.length} items):</div>
            <ul className="list-unstyled small">
              {value.slice(0, 5).map((item, index) => (
                <li key={index} className="mb-1">• {String(item)}</li>
              ))}
              {value.length > 5 && <li className="text-muted">• ... and {value.length - 5} more items</li>}
            </ul>
          </div>
        );
      }
      
      // Handle objects
      return (
        <div>
          <div className="small text-muted mb-1">Object with {Object.keys(value).length} properties:</div>
          <div className="small">
            {Object.entries(value).slice(0, 3).map(([key, val]) => (
              <div key={key} className="mb-1">
                <strong>{key}:</strong> {String(val).length > 50 ? String(val).substring(0, 50) + '...' : String(val)}
              </div>
            ))}
            {Object.keys(value).length > 3 && (
              <div className="text-muted">... and {Object.keys(value).length - 3} more properties</div>
            )}
          </div>
        </div>
      );
    }
    
    if (typeof value === 'string') {
      // Handle long strings better
      if (value.length === 0) {
        return <span className="text-muted">(empty)</span>;
      }
      
      if (value.length > 200) {
        return (
          <div>
            <div className="text-break small">{value}</div>
            <div className="small text-muted">({value.length} characters)</div>
          </div>
        );
      }
      
      return <div className="text-break small">{value}</div>;
    }
    
    if (typeof value === 'boolean') {
      return <span className={`badge ${value ? 'bg-success' : 'bg-danger'}`}>{value ? 'Yes' : 'No'}</span>;
    }
    
    return <span className="small">{String(value)}</span>;
  };

  const renderChanges = (changes) => {
    if (!changes) return null;
    
    // Debug logging
    console.log('renderChanges called with:', changes);
    
    return (
      <div className="mt-2">
        <small className="text-muted fw-bold">Changes:</small>
        <div className="mt-1">
          {Object.entries(changes).map(([field, change]) => (
            <div key={field} className="mb-2 p-2 border rounded bg-light">
              <div className="fw-bold text-primary mb-1">{field}:</div>
              <div className="row">
                <div className="col-6">
                  <small className="text-muted d-block">From:</small>
                  <div className="small">{renderValue(change.from, field)}</div>
                </div>
                <div className="col-6">
                  <small className="text-muted d-block">To:</small>
                  <div className="small">{renderValue(change.to, field)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
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
                        <th style={{ width: '15%' }}>Timestamp</th>
                        <th style={{ width: '12%' }}>User</th>
                        <th style={{ width: '15%' }}>Recipe</th>
                        <th style={{ width: '12%' }}>Action</th>
                        <th style={{ width: '46%' }}>Details</th>
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
                              <small className="text-muted d-block mt-1">
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

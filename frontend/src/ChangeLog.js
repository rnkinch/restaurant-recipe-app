import React, { useState, useEffect, useRef } from 'react';
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
  
  // Use refs to avoid dependency issues
  const filtersRef = useRef(filters);
  const paginationRef = useRef(pagination);
  const debounceTimeoutRef = useRef(null);
  
  // Update refs when state changes
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);
  
  useEffect(() => {
    paginationRef.current = pagination;
  }, [pagination]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const currentFilters = filtersRef.current;
      const currentPagination = paginationRef.current;
      
      const response = await getChangeLogs({
        page: currentPagination.page,
        limit: currentPagination.limit,
        days: currentFilters.days,
        ...(currentFilters.action && { action: currentFilters.action }),
        ...(currentFilters.user && { user: currentFilters.user }),
        ...(currentFilters.recipe && { recipe: currentFilters.recipe })
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

  // Initial load
  useEffect(() => {
    fetchLogs();
  }, []); // Only run on mount

  // Debounced search for filters
  useEffect(() => {
    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    // Set new timeout
    debounceTimeoutRef.current = setTimeout(() => {
      fetchLogs();
    }, 500); // 500ms debounce

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [filters]); // Only depend on filters

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    // Reset to page 1 when filters change
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    // Update the ref immediately
    paginationRef.current = { ...paginationRef.current, page: newPage };
    // Fetch immediately for page changes
    fetchLogs();
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
      <div className="mt-2" style={{ position: 'relative', zIndex: 1 }}>
        <small className="text-muted fw-bold" style={{ fontSize: '0.75rem' }}>Changes:</small>
        <div className="mt-1">
          {Object.entries(changes).map(([field, change]) => (
            <div key={field} className="mb-2 p-2 border rounded bg-light" style={{ position: 'relative', zIndex: 1 }}>
              <div className="fw-bold text-primary mb-1" style={{ fontSize: '0.875rem' }}>{field}:</div>
              <div className="row">
                <div className="col-6">
                  <small className="text-muted d-block" style={{ fontSize: '0.7rem' }}>From:</small>
                  <div className="small" style={{ fontSize: '0.75rem' }}>{renderValue(change.from, field)}</div>
                </div>
                <div className="col-6">
                  <small className="text-muted d-block" style={{ fontSize: '0.7rem' }}>To:</small>
                  <div className="small" style={{ fontSize: '0.75rem' }}>{renderValue(change.to, field)}</div>
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
        <div className="spinner-border" role="status" style={{ width: '1.5rem', height: '1.5rem' }}>
          <span className="visually-hidden" style={{ fontSize: '0.875rem' }}>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h3 style={{ fontSize: '1.5rem' }}>📋 Change Log</h3>
            <div className="text-muted" style={{ fontSize: '0.875rem' }}>
              Showing last {filters.days} days
            </div>
          </div>

          {/* Filters */}
          <div className="card mb-4" style={{ position: 'relative', zIndex: 1000 }}>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-12 col-sm-6 col-md-3">
                  <label className="form-label" style={{ fontSize: '0.875rem' }}>Days</label>
                  <select 
                    className="form-select"
                    style={{ fontSize: '0.875rem' }}
                    value={filters.days}
                    onChange={(e) => handleFilterChange('days', e.target.value)}
                  >
                    <option value={7}>Last 7 days</option>
                    <option value={14}>Last 14 days</option>
                    <option value={30}>Last 30 days</option>
                  </select>
                </div>
                <div className="col-12 col-sm-6 col-md-3">
                  <label className="form-label" style={{ fontSize: '0.875rem' }}>Action</label>
                  <select 
                    className="form-select"
                    style={{ fontSize: '0.875rem' }}
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
                <div className="col-12 col-sm-6 col-md-3">
                  <label className="form-label" style={{ fontSize: '0.875rem' }}>User</label>
                  <input 
                    type="text"
                    className="form-control"
                    style={{ fontSize: '0.875rem' }}
                    placeholder="Filter by username"
                    value={filters.user}
                    onChange={(e) => handleFilterChange('user', e.target.value)}
                  />
                </div>
                <div className="col-12 col-sm-6 col-md-3">
                  <label className="form-label" style={{ fontSize: '0.875rem' }}>Recipe</label>
                  <input 
                    type="text"
                    className="form-control"
                    style={{ fontSize: '0.875rem' }}
                    placeholder="Filter by recipe name"
                    value={filters.recipe}
                    onChange={(e) => handleFilterChange('recipe', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Change Log Table */}
          <div className="card" style={{ position: 'relative', zIndex: 1 }}>
            <div className="card-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              {logs.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted" style={{ fontSize: '0.875rem' }}>No change logs found for the selected criteria.</p>
                </div>
              ) : (
                <div className="table-responsive" style={{ position: 'relative', zIndex: 1 }}>
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th style={{ width: '15%', fontSize: '0.875rem' }}>Timestamp</th>
                        <th style={{ width: '12%', fontSize: '0.875rem' }}>User</th>
                        <th style={{ width: '15%', fontSize: '0.875rem' }}>Recipe</th>
                        <th style={{ width: '12%', fontSize: '0.875rem' }}>Action</th>
                        <th style={{ width: '46%', fontSize: '0.875rem' }}>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log) => (
                        <tr key={log._id}>
                          <td>
                            <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                              {formatTimestamp(log.timestamp)}
                            </small>
                          </td>
                          <td>
                            <strong style={{ fontSize: '0.875rem' }}>{log.username}</strong>
                          </td>
                          <td>
                            <span className="text-primary" style={{ fontSize: '0.875rem' }}>{log.recipeName}</span>
                          </td>
                          <td>
                            <span className={`badge bg-${getActionColor(log.action)}`} style={{ fontSize: '0.75rem' }}>
                              {getActionIcon(log.action)} {log.action}
                            </span>
                          </td>
                          <td>
                            {renderChanges(log.changes)}
                            {log.ipAddress && (
                              <small className="text-muted d-block mt-1" style={{ fontSize: '0.7rem' }}>
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
                  <ul className="pagination justify-content-center" style={{ fontSize: '0.875rem' }}>
                    <li className={`page-item ${pagination.page === 1 ? 'disabled' : ''}`}>
                      <button 
                        className="page-link"
                        style={{ fontSize: '0.875rem' }}
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
                            style={{ fontSize: '0.875rem' }}
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
                        style={{ fontSize: '0.875rem' }}
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

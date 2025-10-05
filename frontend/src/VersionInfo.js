import React, { useState, useEffect } from 'react';
import { Card, Badge, Spinner } from 'react-bootstrap';

const VersionInfo = () => {
  const [versionInfo, setVersionInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadVersionInfo = async () => {
      try {
        const response = await fetch('/version.json');
        if (response.ok) {
          const data = await response.json();
          setVersionInfo(data);
        } else {
          throw new Error('Failed to load version info');
        }
      } catch (err) {
        console.error('Error loading version info:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadVersionInfo();
  }, []);

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short'
      });
    } catch (error) {
      return dateString;
    }
  };

  const getEnvironmentBadge = (env) => {
    const variants = {
      production: 'danger',
      staging: 'warning',
      development: 'info'
    };
    return variants[env] || 'secondary';
  };

  if (loading) {
    return (
      <Card className="mb-3">
        <Card.Header>
          <h6 className="mb-0">Build Information</h6>
        </Card.Header>
        <Card.Body>
          <Spinner size="sm" animation="border" /> Loading version info...
        </Card.Body>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mb-3">
        <Card.Header>
          <h6 className="mb-0">Build Information</h6>
        </Card.Header>
        <Card.Body>
          <small className="text-muted">Unable to load version information: {error}</small>
        </Card.Body>
      </Card>
    );
  }

  if (!versionInfo) {
    return null;
  }

  return (
    <Card className="mb-3">
      <Card.Header>
        <h6 className="mb-0">
          Build Information 
          <Badge bg={getEnvironmentBadge(versionInfo.environment)} className="ms-2">
            {versionInfo.environment}
          </Badge>
        </h6>
      </Card.Header>
      <Card.Body>
        <div className="row">
          <div className="col-md-6">
            <small>
              <strong>Version:</strong> {versionInfo.version}<br/>
              <strong>Build Date:</strong> {formatDate(versionInfo.buildDate)}<br/>
              <strong>Environment:</strong> {versionInfo.environment}
            </small>
          </div>
          <div className="col-md-6">
            <small>
              <strong>Git Branch:</strong> {versionInfo.gitBranch}<br/>
              <strong>Git Commit:</strong> {versionInfo.gitShortCommit}<br/>
              <strong>Build Timestamp:</strong> {versionInfo.buildTimestamp}
            </small>
          </div>
        </div>
        {versionInfo.gitCommit && versionInfo.gitCommit !== 'unknown' && (
          <div className="mt-2">
            <small className="text-muted">
              <strong>Full Commit:</strong> {versionInfo.gitCommit}
            </small>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default VersionInfo;

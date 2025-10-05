import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Alert, Spinner, Image } from 'react-bootstrap';
import { getConfig, updateConfig, uploadLogo } from './api';
import { useNotification } from './NotificationContext';
import VersionInfo from './VersionInfo';

const SetupConfig = ({ refreshConfig }) => {
  const { showError, showSuccess } = useNotification();
  const [config, setConfig] = useState({ appName: '', showLeftNav: true });
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(true);
  const [logoKey, setLogoKey] = useState(Date.now()); // For cache busting

  useEffect(() => {
    getConfig()
      .then(data => {
        setConfig({ appName: data.appName || "XYZCompany Recipe and Plating Guide", showLeftNav: data.showLeftNav });
        setLoading(false);
      })
      .catch(err => {
        showError(`Failed to load config: ${err.message}`);
        setLoading(false);
      });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      if (file) {
        await uploadLogo(file);
        showSuccess('Logo uploaded successfully.');
        setLogoKey(Date.now()); // Update logoKey to force image refresh
      }
      const updated = await updateConfig({ appName: config.appName, showLeftNav: config.showLeftNav });
      setConfig(updated);
      showSuccess('Configuration updated successfully.');
      if (refreshConfig) refreshConfig();
    } catch (err) {
      console.error('Config save error:', err.message);
      showError(`Failed to save: ${err.message}`);
    }
  };

  if (loading) return <Container className="py-3"><Spinner animation="border" /></Container>;

  const logoUrl = `${process.env.REACT_APP_API_URL}/uploads/logo.png?t=${logoKey}`;

  return (
    <Container className="py-3">
      <h2>Configure Setups</h2>
      
      {/* Build Information */}
      <VersionInfo />
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-4">
          <div className="border rounded p-3 bg-light">
            <h6 className="mb-3">
              <i className="bi bi-gear me-2"></i>
              Application Settings
            </h6>
            <Form.Label className="fw-bold">Application Name (Personalization)</Form.Label>
            <Form.Control
              type="text"
              value={config.appName}
              onChange={(e) => setConfig({ ...config, appName: e.target.value })}
              placeholder="Enter custom name"
              required
            />
            <Form.Text className="text-muted d-block mt-2">
              <i className="bi bi-info-circle me-1"></i>
              This name will appear in the application header and browser title.
            </Form.Text>
          </div>
        </Form.Group>
        <Form.Group className="mb-4">
          <div className="border rounded p-3 bg-light">
            <h6 className="mb-3">
              <i className="bi bi-layout-sidebar me-2"></i>
              Navigation Panel Settings
            </h6>
            <Form.Check
              type="checkbox"
              id="showLeftNav"
              className="form-check-lg"
            >
              <Form.Check.Input
                type="checkbox"
                checked={config.showLeftNav}
                onChange={(e) => setConfig({ ...config, showLeftNav: e.target.checked })}
                className="form-check-input-lg"
              />
              <Form.Check.Label className="form-check-label fw-bold">
                Show Left Navigation Panel
              </Form.Check.Label>
            </Form.Check>
            <Form.Text className="text-muted d-block mt-2">
              <i className="bi bi-info-circle me-1"></i>
              Controls whether the left sidebar navigation is visible on all pages. 
              When disabled, users will need to use the top navigation menu.
            </Form.Text>
          </div>
        </Form.Group>
        <Form.Group className="mb-4">
          <div className="border rounded p-3 bg-light">
            <h6 className="mb-3">
              <i className="bi bi-image me-2"></i>
              Logo Management
            </h6>
            
            {/* Current Logo Display */}
            <div className="mb-3">
              <Form.Label className="fw-bold">Current Logo</Form.Label>
              <div>
                <Image
                  src={logoUrl}
                  alt="Current Logo"
                  style={{ width: '150px', border: '1px solid #dee2e6', borderRadius: '4px' }}
                  onError={(e) => {
                    console.error('Config page logo failed to load:', e.target.src);
                    e.target.style.display = 'none';
                  }}
                  onLoad={() => console.log('Config page logo loaded successfully:', logoUrl)}
                />
              </div>
            </div>
            
            <Form.Label className="fw-bold">Upload New Logo</Form.Label>
            <Form.Control
              type="file"
              accept="image/jpeg,image/png"
              onChange={(e) => setFile(e.target.files[0])}
              className="mb-2"
            />
            <Form.Text className="text-muted d-block">
              <i className="bi bi-info-circle me-1"></i>
              Will be saved as logo.png and overwrite existing. Used as default recipe image and PDF watermark. Max 5MB.
            </Form.Text>
          </div>
        </Form.Group>
        <Button variant="primary" type="submit">
          Save Changes
        </Button>
      </Form>
    </Container>
  );
};

export default SetupConfig;

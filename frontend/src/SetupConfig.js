import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Alert, Spinner, Image } from 'react-bootstrap';
import { getConfig, updateConfig, uploadLogo } from './api';
import { useNotification } from './NotificationContext';

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
      <div>
        <Image
          src={logoUrl}
          alt="Current Logo"
          style={{ width: '150px', marginBottom: '20px' }}
          onError={(e) => {
            console.error('Config page logo failed to load:', e.target.src);
            e.target.style.display = 'none';
          }}
          onLoad={() => console.log('Config page logo loaded successfully:', logoUrl)}
        />
      </div>
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Application Name (Personalization)</Form.Label>
          <Form.Control
            type="text"
            value={config.appName}
            onChange={(e) => setConfig({ ...config, appName: e.target.value })}
            placeholder="Enter custom name"
            required
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Check
            type="checkbox"
            label="Show Left Navigation Panel"
            checked={config.showLeftNav}
            onChange={(e) => setConfig({ ...config, showLeftNav: e.target.checked })}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Upload Logo (Will be saved as logo.png and overwrite existing)</Form.Label>
          <Form.Control
            type="file"
            accept="image/jpeg,image/png"
            onChange={(e) => setFile(e.target.files[0])}
          />
          <Form.Text className="text-muted">
            Used as default recipe image and PDF watermark. Max 5MB.
          </Form.Text>
        </Form.Group>
        <Button variant="primary" type="submit">
          Save Changes
        </Button>
      </Form>
    </Container>
  );
};

export default SetupConfig;

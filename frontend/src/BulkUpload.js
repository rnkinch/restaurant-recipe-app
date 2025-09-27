import React, { useState, useRef } from 'react';
import { Container, Row, Col, Card, Button, Form, Alert, ProgressBar, Table, Modal, Tab, Tabs } from 'react-bootstrap';
import { 
  getBulkUploadTemplate, 
  uploadRecipesFromFile, 
  uploadRecipesFromGoogleSheets, 
  previewRecipesFromFile,
  getSupportedFormats 
} from './api';
import { useRole } from './RoleContext';

const BulkUpload = () => {
  const { canEdit } = useRole();
  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState('file');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResults, setUploadResults] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [supportedFormats, setSupportedFormats] = useState([]);
  const [template, setTemplate] = useState(null);
  
  // Google Sheets state
  const [googleSheetId, setGoogleSheetId] = useState('');
  const [googleCredentials, setGoogleCredentials] = useState('');

  React.useEffect(() => {
    if (!canEdit) {
      setError('You do not have permission to upload recipes. Contact an administrator.');
      return;
    }

    loadInitialData();
  }, [canEdit]);

  const loadInitialData = async () => {
    try {
      const [formatsResponse, templateResponse] = await Promise.all([
        getSupportedFormats(),
        getBulkUploadTemplate()
      ]);
      
      setSupportedFormats(formatsResponse.formats);
      setTemplate(templateResponse.template);
    } catch (err) {
      setError('Failed to load upload configuration');
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      setSuccess(null);
      setUploadResults(null);
      setPreviewData(null);
    }
  };

  const handlePreview = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      const result = await previewRecipesFromFile(selectedFile);
      setPreviewData(result);
      setShowPreview(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Preview failed');
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setUploadProgress(0);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const result = await uploadRecipesFromFile(selectedFile, skipDuplicates);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadResults(result);
      setSuccess(result.message);
      
      // Reset form
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 2000);
    }
  };

  const handleGoogleSheetsUpload = async () => {
    if (!googleSheetId.trim()) {
      setError('Please enter a Google Sheet ID');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setUploadProgress(0);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const result = await uploadRecipesFromGoogleSheets(
        googleSheetId.trim(), 
        googleCredentials, 
        skipDuplicates
      );
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadResults(result);
      setSuccess(result.message);
      
      // Reset form
      setGoogleSheetId('');
      setGoogleCredentials('');
    } catch (err) {
      setError(err.response?.data?.message || 'Google Sheets upload failed');
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 2000);
    }
  };

  const downloadTemplate = () => {
    if (!template) return;

    // Create CSV content
    const headers = template.headers.join(',');
    const sampleRow = template.headers.map(header => 
      template.sample[header] ? `"${template.sample[header]}"` : ''
    ).join(',');
    
    const csvContent = `${headers}\n${sampleRow}`;
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'recipe-template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  if (!canEdit) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">
          <Alert.Heading>Access Denied</Alert.Heading>
          <p>You do not have permission to upload recipes. Contact an administrator for access.</p>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <Row>
        <Col>
          <Card>
            <Card.Header>
              <h3>Bulk Recipe Upload</h3>
              <p className="mb-0">Upload multiple recipes from CSV, Excel, or Google Sheets</p>
            </Card.Header>
            <Card.Body>
              {error && <Alert variant="danger">{error}</Alert>}
              {success && <Alert variant="success">{success}</Alert>}

              <Tabs
                activeKey={activeTab}
                onSelect={(k) => setActiveTab(k)}
                className="mb-3"
              >
                <Tab eventKey="file" title="File Upload">
                  <Row className="mt-3">
                    <Col md={8}>
                      <Form.Group className="mb-3">
                        <Form.Label>Select File</Form.Label>
                        <Form.Control
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileSelect}
                          accept={supportedFormats.map(f => `.${f}`).join(',')}
                        />
                        <Form.Text className="text-muted">
                          Supported formats: {supportedFormats.join(', ').toUpperCase()}
                        </Form.Text>
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Check
                          type="checkbox"
                          label="Skip duplicate recipes (by name)"
                          checked={skipDuplicates}
                          onChange={(e) => setSkipDuplicates(e.target.checked)}
                        />
                      </Form.Group>

                      <div className="mb-3">
                        <Button
                          variant="outline-primary"
                          onClick={handlePreview}
                          disabled={!selectedFile || uploading}
                          className="me-2"
                        >
                          Preview
                        </Button>
                        <Button
                          variant="primary"
                          onClick={handleFileUpload}
                          disabled={!selectedFile || uploading}
                        >
                          {uploading ? 'Uploading...' : 'Upload Recipes'}
                        </Button>
                      </div>

                      {uploading && (
                        <div className="mb-3">
                          <ProgressBar now={uploadProgress} label={`${uploadProgress}%`} />
                        </div>
                      )}
                    </Col>
                    <Col md={4}>
                      <Card className="bg-light">
                        <Card.Header>
                          <h6>Template</h6>
                        </Card.Header>
                        <Card.Body>
                          <Button variant="outline-secondary" onClick={downloadTemplate} className="mb-2">
                            Download CSV Template
                          </Button>
                          <div className="small">
                            <strong>Required fields:</strong>
                            <ul className="mb-2">
                              {template?.instructions?.required?.map(field => (
                                <li key={field}>{field}</li>
                              ))}
                            </ul>
                            <strong>Optional fields:</strong>
                            <ul>
                              {template?.instructions?.optional?.map(field => (
                                <li key={field}>{field}</li>
                              ))}
                            </ul>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                </Tab>

                <Tab eventKey="google" title="Google Sheets">
                  <Row className="mt-3">
                    <Col md={8}>
                      <Form.Group className="mb-3">
                        <Form.Label>Google Sheet ID</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="Enter Google Sheet ID from the URL"
                          value={googleSheetId}
                          onChange={(e) => setGoogleSheetId(e.target.value)}
                        />
                        <Form.Text className="text-muted">
                          Example: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms
                        </Form.Text>
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label>Service Account Credentials (JSON)</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={4}
                          placeholder="Paste your Google Service Account JSON credentials here"
                          value={googleCredentials}
                          onChange={(e) => setGoogleCredentials(e.target.value)}
                        />
                        <Form.Text className="text-muted">
                          Get credentials from Google Cloud Console
                        </Form.Text>
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Check
                          type="checkbox"
                          label="Skip duplicate recipes (by name)"
                          checked={skipDuplicates}
                          onChange={(e) => setSkipDuplicates(e.target.checked)}
                        />
                      </Form.Group>

                      <Button
                        variant="primary"
                        onClick={handleGoogleSheetsUpload}
                        disabled={!googleSheetId.trim() || uploading}
                      >
                        {uploading ? 'Uploading...' : 'Upload from Google Sheets'}
                      </Button>

                      {uploading && (
                        <div className="mt-3">
                          <ProgressBar now={uploadProgress} label={`${uploadProgress}%`} />
                        </div>
                      )}
                    </Col>
                    <Col md={4}>
                      <Alert variant="info">
                        <h6>Google Sheets Setup</h6>
                        <ol className="small">
                          <li>Create a Google Sheet with recipe data</li>
                          <li>Share the sheet with your service account email</li>
                          <li>Copy the Sheet ID from the URL</li>
                          <li>Paste your service account credentials</li>
                        </ol>
                      </Alert>
                    </Col>
                  </Row>
                </Tab>
              </Tabs>

              {uploadResults && (
                <Card className="mt-3">
                  <Card.Header>
                    <h5>Upload Results</h5>
                  </Card.Header>
                  <Card.Body>
                    <Row>
                      <Col md={3}>
                        <div className="text-center">
                          <h4 className="text-success">{uploadResults.results.successful}</h4>
                          <p>Successful</p>
                        </div>
                      </Col>
                      <Col md={3}>
                        <div className="text-center">
                          <h4 className="text-danger">{uploadResults.results.failed}</h4>
                          <p>Failed</p>
                        </div>
                      </Col>
                      <Col md={3}>
                        <div className="text-center">
                          <h4 className="text-warning">{uploadResults.results.skipped.length}</h4>
                          <p>Skipped</p>
                        </div>
                      </Col>
                      <Col md={3}>
                        <div className="text-center">
                          <h4 className="text-info">{uploadResults.results.total}</h4>
                          <p>Total</p>
                        </div>
                      </Col>
                    </Row>

                    {uploadResults.results.errors.length > 0 && (
                      <div className="mt-3">
                        <h6>Errors:</h6>
                        <Table striped bordered hover size="sm">
                          <thead>
                            <tr>
                              <th>Row</th>
                              <th>Recipe</th>
                              <th>Error</th>
                            </tr>
                          </thead>
                          <tbody>
                            {uploadResults.results.errors.map((error, index) => (
                              <tr key={index}>
                                <td>{error.row}</td>
                                <td>{error.recipe}</td>
                                <td>{error.errors.join(', ')}</td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Preview Modal */}
      <Modal show={showPreview} onHide={() => setShowPreview(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Recipe Preview</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {previewData && (
            <div>
              <p>Preview of first {previewData.preview.length} recipes (Total: {previewData.total})</p>
              <Table striped bordered hover size="sm">
                <thead>
                  <tr>
                    <th>Row</th>
                    <th>Recipe Name</th>
                    <th>Status</th>
                    <th>Errors</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.preview.map((item, index) => (
                    <tr key={index}>
                      <td>{item.row}</td>
                      <td>{item.recipe}</td>
                      <td>
                        <span className={`badge ${item.isValid ? 'bg-success' : 'bg-danger'}`}>
                          {item.isValid ? 'Valid' : 'Invalid'}
                        </span>
                      </td>
                      <td>{item.errors.join(', ') || 'None'}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPreview(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default BulkUpload;

import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar, Nav, NavDropdown, Container } from 'react-bootstrap';
import { useRole } from './RoleContext';

const Navigation = ({ user, onLogout, config }) => {
  const { isAdmin, isReadOnly } = useRole();

  return (
    <Navbar bg="light" expand="lg" className="mb-3 shadow-sm">
      <Container fluid>
        <Navbar.Brand as={Link} to="/">
          <img
            src={`${process.env.REACT_APP_API_URL}/uploads/logo.png?t=${Date.now()}`}
            alt="Logo"
            style={{ height: '30px', marginRight: '10px' }}
          />
          {config?.appName || 'Recipe Management System'}
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            <Nav.Link as={Link} to="/">Recipes</Nav.Link>
            
            {/* Purveyors - Show for all users */}
            <NavDropdown title="Purveyors" id="purveyors-dropdown">
              <NavDropdown.Item as={Link} to="/purveyors">
                {isReadOnly ? 'View Purveyors' : 'Manage Purveyors'}
              </NavDropdown.Item>
            </NavDropdown>
            
            {/* Reports - Show for all users */}
            <NavDropdown title="Reports" id="reports-dropdown">
              <NavDropdown.Item as={Link} to="/reports/active-ingredients">Active Ingredients</NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/reports/active-recipes">Active Recipes</NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/reports/inactive-recipes">Inactive Recipes</NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/reports/active-recipes-pdf">Active Recipes PDF</NavDropdown.Item>
              <NavDropdown.Divider />
              <NavDropdown.Item as={Link} to="/changelog">📋 Change Log</NavDropdown.Item>
              {isAdmin && (
                <NavDropdown.Item as={Link} to="/reports/users">👥 User Report</NavDropdown.Item>
              )}
            </NavDropdown>
            
            {/* Setups - Admin only */}
            {isAdmin && (
              <NavDropdown title="Setups" id="setups-dropdown">
                <NavDropdown.Item as={Link} to="/config">Configuration</NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/edit-pdf-template">PDF Template</NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item as={Link} to="/users">👥 User Management</NavDropdown.Item>
              </NavDropdown>
            )}
            
            {/* User dropdown */}
            <NavDropdown title={`Welcome, ${user?.username || 'User'}`} id="user-dropdown">
              {isReadOnly && (
                <NavDropdown.Item disabled>
                  <small className="text-muted">Read-Only Access</small>
                </NavDropdown.Item>
              )}
              <NavDropdown.Item onClick={onLogout}>Logout</NavDropdown.Item>
            </NavDropdown>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Navigation;

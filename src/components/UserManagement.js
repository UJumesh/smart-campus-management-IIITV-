import React, { useState, useMemo } from 'react';
import { Table, Form, Button, Badge, InputGroup, Pagination, Dropdown, Card, Row, Col } from 'react-bootstrap';
import { FaSearch, FaFilter, FaUserPlus, FaEdit, FaTrash, FaEllipsisV, FaUserCircle, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';

const UserManagement = () => {
  const [users, setUsers] = useState([
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'Active', lastLogin: '2024-03-15' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'Lecturer', status: 'Inactive', lastLogin: '2024-03-10' },
    { id: 3, name: 'Bob Wilson', email: 'bob@example.com', role: 'Student', status: 'Active', lastLogin: '2024-03-14' },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRole, setSelectedRole] = useState('All');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const itemsPerPage = 5;

  // Memoized filtered users for better performance
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = selectedRole === 'All' || user.role === selectedRole;
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, selectedRole]);

  // Memoized sorted users
  const sortedUsers = useMemo(() => {
    if (!sortConfig.key) return filteredUsers;
    
    return [...filteredUsers].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredUsers, sortConfig]);

  const paginatedUsers = sortedUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <FaSort className="ms-1" />;
    return sortConfig.direction === 'asc' ? 
      <FaSortUp className="ms-1" /> : 
      <FaSortDown className="ms-1" />;
  };

  return (
    <div className="user-management p-4">
      <Card className="shadow-sm">
        <Card.Header className="bg-white border-0 d-flex justify-content-between align-items-center py-3">
          <h5 className="mb-0">
            <FaUserCircle className="me-2 text-primary" />
            User Management
          </h5>
          <Button variant="primary" size="sm" className="d-flex align-items-center">
            <FaUserPlus className="me-2" /> Add New User
          </Button>
        </Card.Header>
        
        <Card.Body>
          <Row className="mb-4">
            <Col md={6} lg={4}>
              <InputGroup>
                <InputGroup.Text className="bg-light">
                  <FaSearch className="text-muted" />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-start-0"
                />
              </InputGroup>
            </Col>
            <Col md={6} lg={4} className="mt-3 mt-md-0">
              <Dropdown>
                <Dropdown.Toggle variant="outline-secondary" id="filter-dropdown" className="w-100">
                  <FaFilter className="me-2" /> {selectedRole}
                </Dropdown.Toggle>
                <Dropdown.Menu className="w-100">
                  <Dropdown.Item onClick={() => setSelectedRole('All')}>All Roles</Dropdown.Item>
                  <Dropdown.Item onClick={() => setSelectedRole('Admin')}>Admins</Dropdown.Item>
                  <Dropdown.Item onClick={() => setSelectedRole('Lecturer')}>Lecturers</Dropdown.Item>
                  <Dropdown.Item onClick={() => setSelectedRole('Student')}>Students</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </Col>
          </Row>

          <div className="table-responsive">
            <Table hover className="mb-0 align-middle">
              <thead className="bg-light">
                <tr>
                  <th 
                    className="cursor-pointer"
                    onClick={() => requestSort('name')}
                  >
                    Name {getSortIcon('name')}
                  </th>
                  <th 
                    className="cursor-pointer"
                    onClick={() => requestSort('email')}
                  >
                    Email {getSortIcon('email')}
                  </th>
                  <th 
                    className="cursor-pointer"
                    onClick={() => requestSort('role')}
                  >
                    Role {getSortIcon('role')}
                  </th>
                  <th 
                    className="cursor-pointer"
                    onClick={() => requestSort('status')}
                  >
                    Status {getSortIcon('status')}
                  </th>
                  <th 
                    className="cursor-pointer"
                    onClick={() => requestSort('lastLogin')}
                  >
                    Last Login {getSortIcon('lastLogin')}
                  </th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map(user => (
                  <tr key={user.id}>
                    <td>
                      <div className="d-flex align-items-center">
                        <FaUserCircle className="me-2 text-muted" />
                        {user.name}
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <Badge bg={
                        user.role === 'Admin' ? 'danger' :
                        user.role === 'Lecturer' ? 'primary' :
                        'info'
                      } className="px-2 py-1">
                        {user.role}
                      </Badge>
                    </td>
                    <td>
                      <Badge bg={user.status === 'Active' ? 'success' : 'secondary'} className="px-2 py-1">
                        {user.status}
                      </Badge>
                    </td>
                    <td>{user.lastLogin}</td>
                    <td className="text-end">
                      <Dropdown>
                        <Dropdown.Toggle variant="link" id="action-dropdown" className="text-dark">
                          <FaEllipsisV />
                        </Dropdown.Toggle>
                        <Dropdown.Menu align="end">
                          <Dropdown.Item>
                            <FaEdit className="me-2 text-primary" /> Edit
                          </Dropdown.Item>
                          <Dropdown.Item className="text-danger">
                            <FaTrash className="me-2" /> Delete
                          </Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>

          <div className="d-flex justify-content-between align-items-center mt-4">
            <div className="text-muted small">
              Showing {paginatedUsers.length} of {filteredUsers.length} users
            </div>
            <Pagination size="sm">
              <Pagination.Prev 
                disabled={currentPage === 1} 
                onClick={() => setCurrentPage(p => p - 1)}
              />
              {[...Array(Math.ceil(filteredUsers.length / itemsPerPage))].map((_, idx) => (
                <Pagination.Item
                  key={idx}
                  active={idx + 1 === currentPage}
                  onClick={() => setCurrentPage(idx + 1)}
                >
                  {idx + 1}
                </Pagination.Item>
              ))}
              <Pagination.Next 
                disabled={currentPage === Math.ceil(filteredUsers.length / itemsPerPage)} 
                onClick={() => setCurrentPage(p => p + 1)}
              />
            </Pagination>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default UserManagement; 
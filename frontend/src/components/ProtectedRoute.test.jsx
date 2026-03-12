import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import ProtectedRoute from './ProtectedRoute';

const mockUseAuth = vi.fn();

vi.mock('../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('ProtectedRoute', () => {
  it('renders protected content when authenticated', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, isInitializing: false });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div>Secret Dashboard</div>
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Secret Dashboard')).toBeInTheDocument();
  });

  it('redirects to login when not authenticated', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, isInitializing: false });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div>Secret Dashboard</div>
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('renders nothing while auth is initializing', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, isInitializing: true });

    const { container } = render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div>Secret Dashboard</div>
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(container).toBeEmptyDOMElement();
  });
});

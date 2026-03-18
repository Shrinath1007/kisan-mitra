import React from 'react';
import { render, screen } from '@testing-library/react';
import LabourDashboard from './Dashboard';
import { AuthProvider } from '../../context/AuthContext';

jest.mock('../../services/mockApi', () => ({
  fetchLabourPredictions: jest.fn(),
  fetchWorkHistoryForLabour: jest.fn(),
}));

jest.mock('../../services/api', () => ({
  fetchAllVacancies: jest.fn(),
}));

describe('LabourDashboard', () => {
  it('renders without crashing', () => {
    render(
      <AuthProvider>
        <LabourDashboard />
      </AuthProvider>
    );
    expect(screen.getByText(/Welcome back/i)).toBeInTheDocument();
  });
});

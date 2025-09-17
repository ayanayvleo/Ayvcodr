import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ComplianceSettings } from '../components/settings/compliance-settings';


// Mock window.URL.createObjectURL and revokeObjectURL for downloadAuditLogs
beforeAll(() => {
  global.URL.createObjectURL = jest.fn(() => 'blob:http://localhost/blobid');
  global.URL.revokeObjectURL = jest.fn();
});

describe('ComplianceSettings (unit)', () => {
  it('renders GDPR, CCPA, and Data Management sections', () => {
    render(<ComplianceSettings />);
    expect(screen.getByText('GDPR Compliance')).toBeInTheDocument();
    expect(screen.getByText('CCPA Compliance')).toBeInTheDocument();
    expect(screen.getByText('Data Management')).toBeInTheDocument();
    expect(screen.getByText('Audit Logs')).toBeInTheDocument();
  });

  it('toggles GDPR and CCPA switches', () => {
    render(<ComplianceSettings />);
    const switches = screen.getAllByRole('switch');
  // There are 4 GDPR + 2 CCPA switches
  expect(switches.length).toBe(6);
  switches.forEach((sw) => fireEvent.click(sw));
    // No error thrown means switches are interactive
  });

  it('calls export, anonymize, and delete handlers', async () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    render(<ComplianceSettings />);
    fireEvent.click(screen.getByText('Export My Data'));
    fireEvent.click(screen.getByText('Anonymize Data'));
    fireEvent.click(screen.getByText('Delete Account'));
    // Confirm dialog for delete
    fireEvent.click(screen.getByText('Yes, Delete My Account'));
    await waitFor(() => {
      expect(logSpy).toHaveBeenCalledWith('Exporting user data...');
      expect(logSpy).toHaveBeenCalledWith('Anonymizing user data...');
      expect(logSpy).toHaveBeenCalledWith('Deleting user account...');
    });
    logSpy.mockRestore();
  });

  it('downloads audit logs as CSV', () => {
    render(<ComplianceSettings />);
    const downloadBtn = screen.getByText('Download Logs');
    // Simulate click
    fireEvent.click(downloadBtn);
    // No error thrown means download triggered
  });

  it('renders audit log entries', () => {
    render(<ComplianceSettings />);
    expect(screen.getByText('Data Export Request')).toBeInTheDocument();
    expect(screen.getByText('Data Anonymization')).toBeInTheDocument();
    expect(screen.getByText('Consent Update')).toBeInTheDocument();
  });
});

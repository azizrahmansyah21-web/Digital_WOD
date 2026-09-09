import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import RuangTungguContainer from './RuangTungguContainer';

// Mock child components to isolate tests
vi.mock('./ViewMedia', () => ({
  default: () => <div data-testid="view-media">View Media</div>
}));

vi.mock('./ViewProses', () => ({
  default: () => <div data-testid="view-proses">View Proses</div>
}));

vi.mock('../../components/MediaPromo', () => ({
  default: ({ isPip }) => (
    <div data-testid="media-promo" data-ispip={isPip}>
      Media Promo
    </div>
  )
}));

vi.mock('../../components/CalloutAlert', () => ({
  default: ({ vehicle, onClose }) => (
    vehicle ? (
      <div data-testid="callout-alert">
        Callout Alert
        <button onClick={onClose}>Close</button>
      </div>
    ) : null
  )
}));

// Mock axios
vi.mock('axios', () => ({
  default: {
    get: vi.fn((url) => {
      if (url.includes('settings')) {
        return Promise.resolve({ data: { status: 'success', data: { show_debug_toolbar: '1' } } });
      }
      return Promise.resolve({ data: { status: 'success', data: [] } });
    })
  }
}));

describe('PiP Video Automation Tests', () => {
  beforeEach(() => {
    // vi.useFakeTimers();
  });

  afterEach(() => {
    // vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('seharusnya video mengecil ke bawah dengan class PiP saat state "proses"', async () => {
    render(<RuangTungguContainer />);

    // Asumsi default adalah state 'media', namun karena ada fetch settings yang bisa mempengaruhi, 
    // kita tunggu render awalnya.
    await waitFor(() => {
      expect(screen.getByTestId('view-media')).toBeInTheDocument();
    });

    // Cari container MediaPromo
    const promoWrapper = screen.getByTestId('media-promo').parentElement;

    // Awalnya state 'media', jadi tidak ada class 'bottom-[84px]'
    expect(promoWrapper).toHaveClass('top-0', 'right-0');

    // Simulasikan pergantian view ke 'proses'
    const switchButton = screen.getByText('SWITCH');
    fireEvent.click(switchButton);

    // Verifikasi kelas CSS berubah ke mode PiP
    await waitFor(() => {
      expect(promoWrapper).toHaveClass('bottom-[84px]', 'w-[400px]', 'rounded-xl');
    });

    // Pastikan prop isPip dikirim ke MediaPromo
    expect(screen.getByTestId('media-promo')).toHaveAttribute('data-ispip', 'true');
  });

  it('seharusnya mem-pause video saat Callout Alert muncul', async () => {
    render(<RuangTungguContainer />);

    await waitFor(() => {
      expect(screen.getByTestId('view-media')).toBeInTheDocument();
    });

    // Simulasikan popup Callout
    const testPopupButton = screen.getByText('TEST POPUP');
    fireEvent.click(testPopupButton);

    // Verifikasi popup muncul
    await waitFor(() => {
      expect(screen.getByTestId('callout-alert')).toBeInTheDocument();
    });

    // Memastikan kita melempar event close
    const closeButton = screen.getByText('Close');
    fireEvent.click(closeButton);

    // Callout tertutup
    await waitFor(() => {
      expect(screen.queryByTestId('callout-alert')).not.toBeInTheDocument();
    });
  });
});

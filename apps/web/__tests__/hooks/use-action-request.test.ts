import { act, renderHook, waitFor } from '@testing-library/react';

import { useActionRequest } from '@/hooks/use-action-request';

describe('useActionRequest', () => {
  it('initializes with default state', () => {
    const mockAction = vi.fn();
    const { result } = renderHook(() => useActionRequest(mockAction));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('sets loading state during execution', async () => {
    const mockAction = vi.fn(() => new Promise<string>((resolve) => setTimeout(() => resolve('done'), 50)));

    const { result } = renderHook(() => useActionRequest(mockAction, { minDuration: 0 }));

    let promise: ReturnType<typeof result.current.execute>;
    act(() => {
      promise = result.current.execute('input');
    });

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      await promise;
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('returns data on success', async () => {
    const mockAction = vi.fn().mockResolvedValue({ success: true });

    const { result } = renderHook(() => useActionRequest(mockAction, { minDuration: 0 }));

    let response: Awaited<ReturnType<typeof result.current.execute>>;
    await act(async () => {
      response = await result.current.execute('input');
    });

    expect(response!.e).toBeNull();
    expect(response!.d).toEqual({ success: true });
    expect(result.current.error).toBeNull();
  });

  it('handles errors correctly', async () => {
    const testError = new Error('Test error');
    const mockAction = vi.fn().mockRejectedValue(testError);

    const { result } = renderHook(() => useActionRequest(mockAction, { minDuration: 0 }));

    let response: Awaited<ReturnType<typeof result.current.execute>>;
    await act(async () => {
      response = await result.current.execute('input');
    });

    expect(response!.e).toEqual(testError);
    expect(response!.d).toBeNull();
    expect(result.current.error).toEqual(testError);
  });

  it('respects minDuration option', async () => {
    vi.useFakeTimers();

    const mockAction = vi.fn().mockResolvedValue('instant');
    const minDuration = 500;

    const { result } = renderHook(() => useActionRequest(mockAction, { minDuration }));

    let promise: ReturnType<typeof result.current.execute>;
    act(() => {
      promise = result.current.execute('input');
    });

    expect(result.current.isLoading).toBe(true);

    // Advance time but not enough
    await act(async () => {
      vi.advanceTimersByTime(200);
    });

    expect(result.current.isLoading).toBe(true);

    // Advance past minDuration
    await act(async () => {
      vi.advanceTimersByTime(300);
      await promise;
    });

    expect(result.current.isLoading).toBe(false);

    vi.useRealTimers();
  });

  it('resets error with reset function', async () => {
    const testError = new Error('Test error');
    const mockAction = vi.fn().mockRejectedValue(testError);

    const { result } = renderHook(() => useActionRequest(mockAction, { minDuration: 0 }));

    await act(async () => {
      await result.current.execute('input');
    });

    expect(result.current.error).toEqual(testError);

    act(() => {
      result.current.reset();
    });

    expect(result.current.error).toBeNull();
  });

  it('clears previous error on new execution', async () => {
    const testError = new Error('Test error');
    const mockAction = vi.fn()
      .mockRejectedValueOnce(testError)
      .mockResolvedValueOnce('success');

    const { result } = renderHook(() => useActionRequest(mockAction, { minDuration: 0 }));

    // First call - error
    await act(async () => {
      await result.current.execute('input');
    });
    expect(result.current.error).toEqual(testError);

    // Second call - should clear error immediately
    let promise: ReturnType<typeof result.current.execute>;
    act(() => {
      promise = result.current.execute('input');
    });

    // Error should be cleared when execution starts
    await waitFor(() => {
      expect(result.current.error).toBeNull();
    });

    await act(async () => {
      await promise;
    });
  });

  it('uses default minDuration of 300ms', async () => {
    vi.useFakeTimers();

    const mockAction = vi.fn().mockResolvedValue('instant');

    const { result } = renderHook(() => useActionRequest(mockAction));

    let promise: ReturnType<typeof result.current.execute>;
    act(() => {
      promise = result.current.execute('input');
    });

    expect(result.current.isLoading).toBe(true);

    // Advance just under default (300ms)
    await act(async () => {
      vi.advanceTimersByTime(250);
    });

    expect(result.current.isLoading).toBe(true);

    // Advance past default
    await act(async () => {
      vi.advanceTimersByTime(50);
      await promise;
    });

    expect(result.current.isLoading).toBe(false);

    vi.useRealTimers();
  });
});

import { useEffect } from 'react';

import { useFriendActivity } from './useFriendActivity';

let mockRows: Record<string, unknown>[] | undefined;
let mockInsert: (payload: { new: Record<string, unknown> }) => void;
const mockClient = {
  getQueryData: jest.fn(() => mockRows),
  getQueryState: jest.fn(() => ({ fetchStatus: 'idle', dataUpdatedAt: 123 })),
  setQueryData: jest.fn((_key, update) => { mockRows = update(mockRows); }),
  invalidateQueries: jest.fn(),
};
const mockChannel: { on: jest.Mock; subscribe: jest.Mock } = {
  on: jest.fn((_event, _filter, handler) => { mockInsert = handler; return mockChannel; }),
  subscribe: jest.fn(),
};
jest.mock('react', () => ({ ...jest.requireActual('react'), useEffect: jest.fn(), useMemo: (compute: () => unknown) => compute() }));
jest.mock('@tanstack/react-query', () => ({
  useQueryClient: () => mockClient,
  useQuery: () => ({ data: mockRows, isLoading: false, error: null, refetch: jest.fn() }),
}));
jest.mock('@/lib/supabase', () => ({ supabase: { channel: () => mockChannel, removeChannel: jest.fn() } }));

const row = { id: 'fresh', user_id: 'friend', album_id: null, album_key: null,
  album_title: 'New album', type: 'added', details: null, created_at: '2026-10-15T12:00:00Z' };

beforeEach(() => {
  jest.clearAllMocks();
  mockRows = [{ id: 'old', userId: 'friend', albumId: null, albumKey: null,
    albumTitle: 'Old album', type: 'added', details: {}, createdAt: '2026-10-14T12:00:00Z' }];
  mockClient.getQueryState.mockReturnValue({ fetchStatus: 'idle', dataUpdatedAt: 123 });
  useFriendActivity(['friend'], 'me');
  (useEffect as jest.Mock).mock.calls[0][0]();
});

it('patches a selected author into the warm page with zero refetches, including duplicate delivery', () => {
  mockInsert({ new: row });
  mockInsert({ new: row });
  expect(mockClient.invalidateQueries).not.toHaveBeenCalled();
  expect(mockRows?.map(event => event.id)).toEqual(['fresh', 'old']);
  expect(mockRows?.[0]).toMatchObject({ albumTitle: 'New album', details: {} });
  expect(mockClient.setQueryData).toHaveBeenLastCalledWith(expect.any(Array), expect.any(Function), { updatedAt: 123 });
});

it('ignores unrelated public authors without reads or cache changes', () => {
  mockInsert({ new: { ...row, user_id: 'stranger' } });
  expect(mockClient.setQueryData).not.toHaveBeenCalled();
  expect(mockClient.invalidateQueries).not.toHaveBeenCalled();
});

it('refetches incomplete selected-author rows instead of fabricating data', () => {
  mockInsert({ new: { id: 'partial', user_id: 'friend' } });
  expect(mockClient.invalidateQueries).toHaveBeenCalledTimes(1);
  expect(mockClient.setQueryData).not.toHaveBeenCalled();
});

it('keeps cold and in-flight snapshots on the authoritative fetch path', () => {
  mockRows = undefined;
  mockInsert({ new: row });
  expect(mockRows).toBeUndefined();
  mockRows = [];
  mockClient.getQueryState.mockReturnValue({ fetchStatus: 'fetching', dataUpdatedAt: 123 });
  mockInsert({ new: row });
  expect(mockClient.invalidateQueries).toHaveBeenCalledTimes(2);
  expect(mockClient.setQueryData).not.toHaveBeenCalled();
});

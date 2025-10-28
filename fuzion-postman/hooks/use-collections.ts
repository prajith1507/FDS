import useSWR from 'swr';

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch data');
  }
  return response.json();
};

export function useCollections() {
  const { data, error, isLoading, mutate } = useSWR(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/apis/`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false
    }
  );

  return {
    collections: data,
    isLoading,
    isError: error,
    refresh: mutate
  };
}
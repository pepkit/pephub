import { SearchHit } from '../../types';
import axios from 'axios';

const API_HOST = import.meta.env.VITE_API_HOST || '';
const API_BASE = `${API_HOST}/api/v1`;

export interface SearchResult {
  query: string;
  results: SearchHit[];
  namespace_hits: string[];
  limit: number;
  offset: number;
}

export const search = (
  query: string,
  limit: number | undefined,
  offset: number | undefined,
  scoreThreshold: number | undefined,
  token: string | null = null,
) => {
  const url = `${API_BASE}/search/`;

  if (!token) {
    return axios
      .post<SearchResult>(url, {
        query: query,
        limit: limit,
        offset: offset,
        score_threshold: scoreThreshold,
      })
      .then((res) => res.data);
  } else {
    return axios
      .post<SearchResult>(
        url,
        {
          query: query,
          limit: limit,
          offset: offset,
          score_threshold: scoreThreshold,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      .then((res) => res.data);
  }
};

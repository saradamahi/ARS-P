import http from "./httpService";
import { apiUrl } from "../config.json";

const apiEndpoint = apiUrl;

// export const resourcesUrl = `data/data.json`; //`/data/data.json`;
// export const unplannedUrl = `data/unplanned.json`;

export const resourcesUrl = `${apiEndpoint}/resources`; //`/data/data.json`;
export const unplannedUrl = `${apiEndpoint}/unplanned`;

export function movieUrl(id) {
  return `${apiEndpoint}/${id}`;
}

export function getResources() {
  return http.get(resourcesUrl);
}

export function getResourceEvents() {
  return http.get(`${apiEndpoint}/resourceEvents`);
}

export function getMovie(movieId) {
  return http.get(movieUrl(movieId));
}

export function saveMovie(movie) {
  if (movie._id) {
    const body = { ...movie };
    delete body._id;
    return http.put(movieUrl(movie._id), body);
  }

  return http.post(apiEndpoint, movie);
}

export function deleteMovie(movieId) {
  return http.delete(movieUrl(movieId));
}

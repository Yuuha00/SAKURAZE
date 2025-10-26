const SITE_URL = import.meta.env.VITE_SITE_URL || 'http://localhost:8080';

export const getURL = () => {
  let url = SITE_URL ?? '';
  // Make sure to include `https://` when not localhost.
  url = url.includes('http') ? url : `https://${url}`;
  // Make sure to include trailing `/`
  url = url.charAt(url.length - 1) === '/' ? url : `${url}/`;
  return url;
};

export const getRedirectURL = (path: string = '') => {
  const url = getURL();
  return `${url}${path}`;
};
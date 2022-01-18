import axios, { AxiosError } from 'axios';
import { destroyCookie, parseCookies, setCookie } from 'nookies';
import Router from 'next/router';

let cookies = parseCookies();
let isRefreshing = false;
let failedRequestsQueue = [];

export const api = axios.create({
  baseURL: 'http://localhost:3333',
  headers: {
    Authorization: `Bearer ${cookies['nextauth.token']}`
  }
});

api.interceptors.response.use((response) => {
  // caso a resposta seja sem erro utiliza esse primeiro paramentro
  // Aqui no caso não quer fazer nada. Então só retorna o response.
  return response;
}, (error: AxiosError) => {
  // Caso ocorra um erro utiliza o segundo parametro.
  // Nesse caso interessa o erro
  if (error.response.status === 401) {
    if (error.response.data?.code === 'token.expired') {
      cookies = parseCookies();

      const { 'nextauth.refreshToken': refreshToken } = cookies;

      // Tem todas as configurações da chamada feita
      // url, parametros etc
      const originalConfig = error.config;

      if(!isRefreshing) {
        api.post('/refresh', {
          refreshToken
        }).then(response => {
          const { token } = response.data;
  
          setCookie(undefined, 'nextauth.token', token, {
            maxAge: 60 * 60 * 24 * 30, // 1 month
            path: '/'
          });
          setCookie(undefined, 'nextauth.refreshToken', response.data.refreshToken, {
            maxAge: 60 * 60 * 24 * 30, // 1 month
            path: '/'
          });
  
          api.defaults.headers['Authorization'] = `Bearer ${token}`;

          failedRequestsQueue.forEach(request => request.onSuccess(token));
          failedRequestsQueue = [];
        }).catch(err => {
          failedRequestsQueue.forEach(request => request.onFailure(err));
          failedRequestsQueue = [];
        })
        .finally(() => {
          isRefreshing = false;
        });
      }
      return new Promise((resolve, reject) => {
        failedRequestsQueue.push({
          onSuccess: (token: string) => {
            originalConfig.headers['Authorization'] = `Bearer ${token}`;

            resolve(api(originalConfig));
          },
          onFailure: (error: AxiosError) => {
            reject(error);
          }
        });
      });
    } else {
      // Isso é basicamente uma função de logout
      destroyCookie(undefined, 'nextauth.token');
      destroyCookie(undefined, 'nextauth.refreshToken');
      Router.push('/');
    }
  }

  return Promise.reject(error);
});
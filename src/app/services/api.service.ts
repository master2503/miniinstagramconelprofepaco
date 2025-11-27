import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl; // Corregido para evitar errores

  constructor(private http: HttpClient) {}

  // ===============================
  // 🔐 AUTH
  // ===============================

  login(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, data);
  }

  register(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, data);
  }

  // ===============================
  // 🧩 POSTS
  // ===============================

  // Listar posts (con paginado opcional)
  getPosts(): Observable<any> {
    return this.getPostsPage();
  }

  getPostsPage(page?: number): Observable<any> {
    const headers = this.authHeaders();
    let url = `${this.apiUrl}/posts`;

    if (page && page > 0) url += `?page=${page}`;

    return this.http.get(url, { headers });
  }

  // Obtener detalle de un post específico
  getPost(postId: string | number): Observable<any> {
    const headers = this.authHeaders();
    return this.http.get(`${this.apiUrl}/posts/${postId}`, { headers });
  }

  // Crear publicación (imagen en FormData)
  uploadPost(formData: FormData): Observable<any> {
    const headers = this.authHeaders();
    return this.http.post(`${this.apiUrl}/posts`, formData, { headers });
  }

  // Eliminar publicación
  deletePost(postId: string | number): Observable<any> {
    const headers = this.authHeaders();
    return this.http.delete(`${this.apiUrl}/posts/${postId}`, { headers });
  }

  // ===============================
  // ❤️ LIKES
  // ===============================

  likePost(postId: string | number): Observable<any> {
    const headers = this.authHeaders();
    const url = `${this.apiUrl}/posts/${postId}/like`;
    console.log('URL para dar like:', url);
    console.log('Token enviado:', localStorage.getItem('token'));

    return this.http.post(url, {}, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
  }

  unlikePost(postId: string | number): Observable<any> {
    const headers = this.authHeaders();
    return this.http.delete(`${this.apiUrl}/posts/${postId}/like`, { headers });
  }

  // ===============================
  // 💬 COMENTARIOS
  // ===============================

  getComments(postId: string | number): Observable<any> {
    const headers = this.authHeaders();
    return this.http.get(`${this.apiUrl}/posts/${postId}/comments`, { headers });
  }

  createComment(postId: string | number, content: string): Observable<any> {
    const headers = this.authHeaders();
    return this.http.post(
      `${this.apiUrl}/posts/${postId}/comments`,
      { content },
      { headers }
    );
  }

  // ===============================
  // 🤝 AMIGOS / SOLICITUDES
  // ===============================

  sendFriendRequest(userId: string | number): Observable<any> {
    const headers = this.authHeaders();
    const url = `${this.apiUrl}/users/${userId}/friend`;
    console.log('URL para enviar solicitud de amistad:', url);
    console.log('Token enviado:', localStorage.getItem('token'));

    return this.http.post(url, {}, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
  }

  listFriends(): Observable<any> {
    const headers = this.authHeaders();
    const url = `${this.apiUrl}/friends`;
    console.log('URL para listar amigos:', url);
    console.log('Token enviado:', localStorage.getItem('token'));

    return this.http.get(url, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
  }

  listPendingFriendRequests(): Observable<any> {
    const headers = this.authHeaders();
    const url = `${this.apiUrl}/friendships/pending`;
    console.log('URL para listar solicitudes pendientes:', url);
    console.log('Token enviado:', localStorage.getItem('token'));

    return this.http.get(url, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
  }

  acceptFriendship(friendshipId: string | number): Observable<any> {
    const headers = this.authHeaders();
    const url = `${this.apiUrl}/friendships/${friendshipId}/accept`;
    console.log('URL para aceptar solicitud de amistad:', url);
    console.log('Token enviado:', localStorage.getItem('token'));

    return this.http.post(url, {}, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
  }

  // ===============================
  // 🔧 Helpers
  // ===============================

  private authHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || '';
    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }
}

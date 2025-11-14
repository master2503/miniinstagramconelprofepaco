import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;

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
    return this.http.post(`${this.apiUrl}/posts/${postId}/like`, {}, { headers });
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
    return this.http.post(`${this.apiUrl}/users/${userId}/friend`, {}, { headers });
  }

  listFriends(): Observable<any> {
    const headers = this.authHeaders();
    return this.http.get(`${this.apiUrl}/friends`, { headers });
  }

  listPendingFriendRequests(): Observable<any> {
    const headers = this.authHeaders();
    return this.http.get(`${this.apiUrl}/friendships/pending`, { headers });
  }

  acceptFriendship(friendshipId: string | number): Observable<any> {
    const headers = this.authHeaders();
    return this.http.post(
      `${this.apiUrl}/friendships/${friendshipId}/accept`,
      {},
      { headers }
    );
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

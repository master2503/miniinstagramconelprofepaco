import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // 🔐 Login del usuario
  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials);
  }

  // 📸 Obtener publicaciones
  getPosts(): Observable<any> {
    return this.http.get(`${this.apiUrl}/posts`);
  }

  // ➕ Crear publicación
  createPost(postData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/posts`, postData);
  }
}

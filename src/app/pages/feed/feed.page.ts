import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { IonicModule, ActionSheetController } from '@ionic/angular';
import { environment } from 'src/environments/environment';
import { Router } from '@angular/router';



@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [IonicModule, CommonModule],
  templateUrl: './feed.page.html',
  styleUrls: ['./feed.page.scss']
})
export class FeedPage implements OnInit {
  posts: any[] = [];
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  constructor(private api: ApiService, private router: Router, private actionSheetCtrl: ActionSheetController) {}

  ngOnInit() {
    this.loadPosts();
  }

loadPosts() {
  this.api.getPosts().subscribe({
    next: (res: any) => {
      console.log('API Response:', res);
      this.posts = res.data || res; // depende de cómo responde tu API
      console.log('Posts después de asignar:', this.posts);
      console.log('Número de posts:', this.posts?.length);
      // Normalizar URLs y estado local
      const apiBase = environment.apiUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');
      console.log('API Base:', apiBase);
      this.posts = (this.posts || []).map((p: any) => {
        console.log('Post original:', p);
        console.log('Post image_url:', p.image_url);
        // normalizar imagen del post
        const normalizedImageUrl = this.normalizeUrl(p.image_url, apiBase);
        p.image_url = normalizedImageUrl;
        console.log('Normalized image_url:', normalizedImageUrl);
        // normalizar avatar
        const avatar = p.user?.avatar || p.avatar || null;
        p.user = p.user || {};
        p.user.avatar = this.normalizeUrl(avatar, apiBase) || 'assets/icon/favicon.png';
        // estado local para like
        p._liked = !!p.liked;
        p.likes = p.likes || 0;
        console.log('Post después de normalizar:', p);
        return p;
      });
      console.log('Posts finales:', this.posts);
    },
    error: (err: any) => {
      console.error('Error al cargar publicaciones', err);
      console.error('Status:', err.status);
      console.error('Mensaje:', err.message);
    }
  });
}

// LOGOUT
logout() {
  localStorage.removeItem('token');
  this.router.navigate(['/login']);
}

// UPLOAD: UI -> action sheet -> camera or gallery
async openUploadOptions() {
  const sheet = await this.actionSheetCtrl.create({
    header: 'Subir foto',
    buttons: [
      {
        text: 'Tomar foto',
        icon: 'camera',
        handler: () => this.captureFromCamera()
      },
      {
        text: 'Elegir desde galería',
        icon: 'images',
        handler: () => this.triggerFileInput()
      },
      {
        text: 'Cancelar',
        icon: 'close',
        role: 'cancel'
      }
    ]
  });
  await sheet.present();
}

// For devices with Camera plugin (requiere @capacitor/camera instalado)
async captureFromCamera() {
  console.warn('Camera plugin no está disponible. Usa la galería en su lugar.');
  // En web usamos el file input como fallback
  this.triggerFileInput();
}

// Trigger hidden file input for gallery
triggerFileInput() {
  if (this.fileInput && this.fileInput.nativeElement) {
    this.fileInput.nativeElement.value = '';
    this.fileInput.nativeElement.click();
  }
}

onFileSelected(ev: Event) {
  const input = ev.target as HTMLInputElement;
  const file = input.files && input.files[0];
  if (!file) return;
  this.uploadFileBlob(file, file.name);
}

dataURItoBlob(dataURI: string) {
  // Fallback si falla la conversión; retorna un Blob vacío o maneja error
  try {
    const byteString = atob(dataURI.split(',')[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
    return new Blob([ab], { type: 'image/jpeg' });
  } catch (err) {
    console.error('Error convirtiendo DataURI a Blob', err);
    return new Blob([], { type: 'image/jpeg' });
  }
}

uploadFileBlob(fileBlob: Blob | File, filename: string) {
  const fd = new FormData();
  fd.append('image', fileBlob, filename);
  // opcional: añadir caption
  fd.append('caption', '');
  this.api.uploadPost(fd).subscribe({
    next: (res) => {
      // recargar posts
      this.loadPosts();
    },
    error: (err) => {
      console.error('Error subiendo imagen', err);
    }
  });
}

// Construye URL absoluta para imagenes que vienen como rutas relativas
normalizeUrl(url: string | undefined | null, apiBase: string): string | null {
  if (!url) return null;
  const trimmed = (url || '').toString().trim();
  
  // No procesar rutas de assets locales
  if (/^assets\//i.test(trimmed)) return trimmed;
  
  // Si ya es http(s) o data URI, retornar tal cual
  if (/^https?:\/\//i.test(trimmed) || /^data:/i.test(trimmed)) return trimmed;
  
  // Para rutas relativas (storage/..., /storage/..., uploads/..., etc.)
  // Construir URL absoluta
  const clean = trimmed.replace(/^\/+/, ''); // remover slashes iniciales
  
  // Si apiBase termina con /, no añadir otro
  const separator = apiBase.endsWith('/') ? '' : '/';
  const result = `${apiBase}${separator}${clean}`;
  
  console.log(`Normalizing URL: "${url}" -> "${result}"`);
  return result;
}

imgUrl(url: string | undefined | null) {
  return this.normalizeUrl(url, environment.apiUrl.replace(/\/api\/?$/, '').replace(/\/$/, '')) || 'assets/icon/favicon.png';
}

toggleLike(post: any) {
  console.log('Toggle like clicked for post:', post.id, 'Current liked state:', post._liked);
  // Estado previo para poder revertir en caso de error
  const prevLiked = !!post._liked;
  const prevLikes = post.likes || 0;
  // Cambio inmediato en UI (optimista)
  post._liked = !prevLiked;
  post.likes = post._liked ? prevLikes + 1 : Math.max(0, prevLikes - 1);
  console.log('Updated UI - liked:', post._liked, 'likes:', post.likes);

  // Llamar API correspondiente (POST = like, DELETE = unlike)
  const call = post._liked ? this.api.likePost(post.id) : this.api.unlikePost(post.id);
  console.log('Calling API:', post._liked ? 'likePost' : 'unlikePost');
  call.subscribe({
    next: (res) => {
      console.log('Like API success:', res);
      // éxito: podríamos sincronizar con respuesta si devolviera el estado.
    },
    error: (err: any) => {
      console.error('Error al actualizar like:', err.status, err.statusText, err.error);
      // revertir al estado anterior
      post._liked = prevLiked;
      post.likes = prevLikes;
      console.log('Reverted to:', post._liked, post.likes);
    }
  });
}
}

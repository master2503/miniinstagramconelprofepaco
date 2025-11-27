import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { IonicModule, ActionSheetController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { environment } from 'src/environments/environment';
import { Router, RouterLink } from '@angular/router';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
// 1. IMPORTAR addIcons y los iconos específicos de ionicons
import { addIcons } from 'ionicons';
import { camera, people, logOut, heart, heartOutline, images, close, chatbubbleOutline, send } from 'ionicons/icons';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterLink],
  templateUrl: './feed.page.html',
  styleUrls: ['./feed.page.scss']
})
export class FeedPage implements OnInit {
  posts: any[] = [];
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  selectedPostId: number | null = null; // Para mostrar/ocultar comentarios
  commentText: string = ''; // Para guardar el texto del comentario siendo editado
  uploadCaption: string = ''; // Campo para el comentario antes de subir

  constructor(
    private api: ApiService, 
    private router: Router, 
    private actionSheetCtrl: ActionSheetController
  ) {
    // 2. REGISTRAR LOS ICONOS EN EL CONSTRUCTOR
    // Esto soluciona los cuadros grises en la UI
    addIcons({ 
      camera, 
      people, 
      'log-out': logOut, 
      heart, 
      'heart-outline': heartOutline,
      images,
      close,
      'chatbubble-outline': chatbubbleOutline,
      send
    });
  }

  ngOnInit() {
    this.loadPosts();
  }

  // Método para el refresher (pull to refresh)
  refresh(event: any) {
    this.loadPosts();
    // Completar la animación del refresher después de cargar
    setTimeout(() => {
      event.detail.complete();
    }, 1000);
  }

  loadPosts() {
    this.api.getPosts().subscribe({
      next: (res: any) => {
        console.log('API Response:', res);
        this.posts = res.data || res; 
        console.log('Posts después de asignar:', this.posts);
        
        const apiBase = environment.apiUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');
        console.log('API Base:', apiBase);

        this.posts = (this.posts || []).map((p: any) => {
          // DEBUG: Ver la estructura COMPLETA del primer post
          if (!this.posts[0]._logged) {
            console.log('ESTRUCTURA COMPLETA DEL PRIMER POST:', p);
            console.log('Todas las keys:', Object.keys(p));
            this.posts[0]._logged = true;
          }
          
          // 1. Normalizar imagen - EL CAMPO CORRECTO ES 'image'
          const imageUrl = p.image || p.image_url || p.photo || p.picture || null;
          const normalizedImageUrl = this.normalizeUrl(imageUrl, apiBase);
          p.image_url = normalizedImageUrl; // unificamos en image_url para template
          console.log('Original image:', p.image);
          console.log('Normalized image_url:', normalizedImageUrl);

          // 2. Normalizar avatar
          const avatar = p.user?.avatar || p.avatar || null;
          p.user = p.user || {};
          p.user.avatar = this.normalizeUrl(avatar, apiBase) || 'images/default-avatar.png';

          // 3. CORRECCIÓN LIKES: Convertir Objeto/Array a Número
          // Esto soluciona el error "[object Object] me gusta"
          if (Array.isArray(p.likes)) {
            // Si es un array de usuarios, tomamos la longitud
            p.likes = p.likes.length;
          } 
          else if (typeof p.likes === 'object' && p.likes !== null) {
            // Si es un objeto con { count: X }, tomamos el count
            p.likes = p.likes.count || p.likes.total || 0;
          } 
          else {
            // Si ya es número o null
            p.likes = p.likes || 0;
          }

          // 4. Estado local para like
          p._liked = !!p.liked;

          return p;
        });
        console.log('Posts finales:', this.posts);
      },
      error: (err: any) => {
        console.error('Error al cargar publicaciones', err);
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
    // Este método ya no se usa, mantenerlo por compatibilidad
  }

  // Método para capturar imagen desde la cámara
  async captureFromCamera() {
    // Verificar si estamos en un navegador web o en una aplicación móvil
    const isWeb = !(window as any)['cordova'] && !(window as any)['capacitor'];
    
    if (isWeb) {
      // En navegador web, usar la cámara del navegador
      this.captureFromBrowser();
    } else {
      // En aplicación móvil, usar Capacitor Camera
      try {
        const image = await Camera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Camera
        });

        if (image && image.dataUrl) {
          const blob = this.dataURItoBlob(image.dataUrl);
          this.promptUpload(blob, 'photo.jpg');
        }
      } catch (error) {
        console.error('Error al capturar imagen:', error);
      }
    }
  }

  // Método para capturar imagen desde la cámara del navegador
  async captureFromBrowser() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      const video = document.createElement('video');
      video.srcObject = stream;
      video.autoplay = true;
      video.style.width = '100%';
      video.style.height = '100%';
      video.style.objectFit = 'cover';

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      // Crear contenedor para el video
      const videoContainer = document.createElement('div');
      videoContainer.id = 'camera-container';
      videoContainer.style.position = 'fixed';
      videoContainer.style.top = '0';
      videoContainer.style.left = '0';
      videoContainer.style.width = '100%';
      videoContainer.style.height = '100%';
      videoContainer.style.background = '#000';
      videoContainer.style.display = 'flex';
      videoContainer.style.flexDirection = 'column';
      videoContainer.style.justifyContent = 'center';
      videoContainer.style.alignItems = 'center';
      videoContainer.style.zIndex = '9999';
      
      const videoWrapper = document.createElement('div');
      videoWrapper.style.width = '100%';
      videoWrapper.style.height = '100%';
      videoWrapper.style.display = 'flex';
      videoWrapper.style.justifyContent = 'center';
      videoWrapper.style.alignItems = 'center';
      videoWrapper.appendChild(video);
      
      videoContainer.appendChild(videoWrapper);

      // Crear controles
      const controlsContainer = document.createElement('div');
      controlsContainer.style.position = 'absolute';
      controlsContainer.style.bottom = '30px';
      controlsContainer.style.width = '100%';
      controlsContainer.style.display = 'flex';
      controlsContainer.style.justifyContent = 'center';
      controlsContainer.style.gap = '15px';
      controlsContainer.style.zIndex = '10000';

      // Botón Capturar
      const captureButton = document.createElement('button');
      captureButton.textContent = '📷 Capturar';
      captureButton.style.padding = '12px 30px';
      captureButton.style.background = '#3897f0';
      captureButton.style.color = '#fff';
      captureButton.style.border = 'none';
      captureButton.style.borderRadius = '25px';
      captureButton.style.fontSize = '16px';
      captureButton.style.cursor = 'pointer';
      captureButton.style.fontWeight = 'bold';
      captureButton.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
      captureButton.style.transition = 'all 0.3s ease';
      
      captureButton.onmouseover = () => {
        captureButton.style.background = '#2a7fbf';
        captureButton.style.transform = 'scale(1.05)';
      };
      
      captureButton.onmouseout = () => {
        captureButton.style.background = '#3897f0';
        captureButton.style.transform = 'scale(1)';
      };

      // Botón Cancelar
      const cancelButton = document.createElement('button');
      cancelButton.textContent = '✕ Cancelar';
      cancelButton.style.padding = '12px 30px';
      cancelButton.style.background = '#e74c3c';
      cancelButton.style.color = '#fff';
      cancelButton.style.border = 'none';
      cancelButton.style.borderRadius = '25px';
      cancelButton.style.fontSize = '16px';
      cancelButton.style.cursor = 'pointer';
      cancelButton.style.fontWeight = 'bold';
      cancelButton.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
      cancelButton.style.transition = 'all 0.3s ease';
      
      cancelButton.onmouseover = () => {
        cancelButton.style.background = '#c0392b';
        cancelButton.style.transform = 'scale(1.05)';
      };
      
      cancelButton.onmouseout = () => {
        cancelButton.style.background = '#e74c3c';
        cancelButton.style.transform = 'scale(1)';
      };

      controlsContainer.appendChild(captureButton);
      controlsContainer.appendChild(cancelButton);
      videoContainer.appendChild(controlsContainer);

      document.body.appendChild(videoContainer);

      // Función para limpiar
      const cleanup = () => {
        stream.getTracks().forEach(track => track.stop());
        if (document.body.contains(videoContainer)) {
          document.body.removeChild(videoContainer);
        }
      };

      // Evento de captura
      captureButton.addEventListener('click', () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context?.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL('image/jpeg', 0.95);

        cleanup();
        const blob = this.dataURItoBlob(imageData);
        this.promptUpload(blob, 'captured-photo.jpg');
      });

      // Evento de cancelar
      cancelButton.addEventListener('click', cleanup);

      // Permitir capturar con tecla Enter
      const keyHandler = (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
          captureButton.click();
        } else if (e.key === 'Escape') {
          cancelButton.click();
          document.removeEventListener('keydown', keyHandler);
        }
      };
      document.addEventListener('keydown', keyHandler);

    } catch (error) {
      console.error('Error al acceder a la cámara:', error);
      alert('No se pudo acceder a la cámara. Verifica que:\n1. Permitas el acceso a la cámara\n2. Estés usando HTTPS o localhost\n3. Tu navegador soporte acceso a cámara web');
    }
  }

  // Prompt para comentar antes de subir la foto
  async promptUpload(fileBlob: Blob, filename: string) {
    const alert = document.createElement('ion-alert');
    alert.header = 'Subir Foto';
    alert.cssClass = 'custom-upload-alert';
    alert.inputs = [
      {
        name: 'caption',
        type: 'text',
        placeholder: 'Escribe un comentario para tu foto...'
      }
    ];
    alert.buttons = [
      {
        text: 'Cancelar',
        role: 'cancel'
      },
      {
        text: 'Subir',
        handler: (data) => {
          this.uploadCaption = data.caption || '';
          this.uploadFileBlob(fileBlob, filename);
        }
      }
    ];
    document.body.appendChild(alert);
    await alert.present();
  }

  // Trigger hidden file input for gallery
  triggerFileInput() {
    console.log('triggerFileInput() llamado');
    
    // Crear un input de archivo dinámicamente (más confiable)
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';
    
    // Manejar el cambio de archivo
    input.onchange = (event: Event) => {
      console.log('Archivo seleccionado');
      const target = event.target as HTMLInputElement;
      const file = target.files?.[0];
      
      if (file) {
        console.log('Archivo:', file.name, 'Tamaño:', file.size);
        this.promptUpload(file, file.name);
      } else {
        console.log('No se seleccionó archivo');
      }
    };
    
    // Manejar si el usuario cancela
    input.oncancel = () => {
      console.log('Selección de archivo cancelada');
    };
    
    // Agregar al documento y hacer clic
    document.body.appendChild(input);
    input.click();
    
    // Limpiar después de un pequeño delay
    setTimeout(() => {
      if (document.body.contains(input)) {
        document.body.removeChild(input);
      }
    }, 100);
  }

  // Sobrescribe onFileSelected para pedir comentario antes de subir
  onFileSelected(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files && input.files[0];
    if (!file) return;
    // Pedir comentario antes de subir
    this.promptUpload(file, file.name);
  }

  dataURItoBlob(dataURI: string) {
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
    fd.append('caption', this.uploadCaption); // Incluir el comentario

    this.api.uploadPost(fd).subscribe({
      next: (res) => {
        this.uploadCaption = '';
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
    
    // IMPORTANTE: Si apiBase YA incluye /api, usarlo directamente
    // Si no, construir con /storage o /uploads
    let baseUrl = apiBase;
    
    // Si apiBase termina con /api, lo dejamos así
    // Si no, asumimos que es la URL base sin /api
    
    const clean = trimmed.replace(/^\/+/, ''); // remover / iniciales
    
    const separator = baseUrl.endsWith('/') ? '' : '/';
    const result = `${baseUrl}${separator}${clean}`;
    
    console.log(`normalizeUrl: base="${apiBase}" + url="${trimmed}" = "${result}"`);
    return result;
  }

  imgUrl(url: string | undefined | null) {
    const normalized = this.normalizeUrl(url, environment.apiUrl.replace(/\/api\/?$/, '').replace(/\/$/, '')) || 'assets/icon/favicon.png';
    
    // Si la URL normalizada no carga, intentar con /storage/ como fallback
    // Esto lo podemos hacer con onerror en el HTML, pero aquí preparamos ambas rutas
    return normalized;
  }

  toggleLike(post: any) {
    console.log('Intentando dar like a la publicación:', post.id);

    const prevLiked = !!post._liked;
    const prevLikes = typeof post.likes === 'number' ? post.likes : 0;

    // Cambio optimista en la interfaz
    post._liked = !prevLiked;
    post.likes = post._liked ? prevLikes + 1 : Math.max(0, prevLikes - 1);

    // Llamada al servidor para registrar el like
    this.api.likePost(post.id).subscribe({
      next: (res) => {
        console.log('Like registrado correctamente en el servidor:', res);
        if (!res || res.error) {
          console.error('Error en la respuesta del servidor:', res);
          // Revertir el estado si la respuesta no es exitosa
          post._liked = prevLiked;
          post.likes = prevLikes;
          alert('No se pudo registrar el like. Inténtalo nuevamente.');
        }
      },
      error: (err) => {
        console.error('Error al registrar el like:', err);
        // Revertir el estado si ocurre un error
        post._liked = prevLiked;
        post.likes = prevLikes;
        alert('Hubo un error al intentar dar like. Inténtalo nuevamente.');
      }
    });
  }

  // COMENTARIOS
  toggleComments(postId: number) {
    this.selectedPostId = this.selectedPostId === postId ? null : postId;
    this.commentText = ''; // Limpiar campo al cambiar de post
  }

  submitComment(post: any) {
    if (!this.commentText.trim()) return;
    
    this.api.createComment(post.id, this.commentText).subscribe({
      next: (res) => {
        console.log('Comentario creado:', res);
        this.commentText = '';
        // Recargar comentarios del post
        this.loadComments(post);
      },
      error: (err) => {
        console.error('Error al crear comentario:', err);
      }
    });
  }

  loadComments(post: any) {
    this.api.getComments(post.id).subscribe({
      next: (res: any) => {
        post.comments = res.data || res || [];
        console.log('Comentarios cargados:', post.comments);
      },
      error: (err) => {
        console.error('Error al cargar comentarios:', err);
      }
    });
  }

  // Método para eliminar un post
  deletePost(postId: number) {
    if (confirm('¿Estás seguro de que deseas eliminar esta publicación?')) {
      this.api.deletePost(postId).subscribe({
        next: () => {
          alert('Publicación eliminada con éxito.');
          this.loadPosts(); // Recargar publicaciones
        },
        error: (err) => {
          console.error('Error al eliminar la publicación:', err);
          alert('Hubo un error al intentar eliminar la publicación.');
        }
      });
    }
  }
}
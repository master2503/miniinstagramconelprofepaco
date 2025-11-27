import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-friends',
  standalone: true,
  templateUrl: './friends.page.html',
  styleUrls: ['./friends.page.scss'],
  imports: [IonicModule, CommonModule]
})
export class FriendsPage implements OnInit {

  friends: any[] = [];
  pending: any[] = [];
  users: any[] = []; // Lista de usuarios para enviar solicitud de amistad
  loading = true;

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadData();
  }

  handleError(error: any) {
    console.error('Error en la operación:', error);
    alert('Ocurrió un error. Por favor, inténtalo nuevamente.');
  }

  loadData() {
    this.loading = true;

    Promise.all([
      this.api.listFriends().toPromise(),
      this.api.listPendingFriendRequests().toPromise()
    ])
    .then(([friends, pending]: any) => {
      this.friends = friends || [];x
    })
    .catch(error => this.handleError(error))
    .finally(() => this.loading = false);
  }

  accept(friendshipId: number) {
    this.api.acceptFriendship(friendshipId).subscribe({
      next: () => this.loadData(),
      error: err => this.handleError(err)
    });
  }

  sendRequest(userId: number) {
    this.api.sendFriendRequest(userId).subscribe({
      next: () => {
        alert('Solicitud de amistad enviada');
        this.loadData();
      },
      error: err => this.handleError(err)
    });
  }
}

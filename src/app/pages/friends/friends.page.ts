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
  loading = true;

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading = true;

    Promise.all([
      this.api.listFriends().toPromise(),
      this.api.listPendingFriendRequests().toPromise()
    ])
    .then(([friends, pending]: any) => {
      this.friends = friends || [];
      this.pending = pending || [];
    })
    .finally(() => this.loading = false);
  }

  accept(friendshipId: number) {
    this.api.acceptFriendship(friendshipId).subscribe({
      next: () => this.loadData(),
      error: err => console.error('Error aceptando amistad', err)
    });
  }
}

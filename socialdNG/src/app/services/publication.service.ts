import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { PublicationModel } from '../models/publication.model';
import { ServiceConfig } from 'src/app/config/service-config';
import { SecurityService } from './security.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PublicationService {
  entity: string = 'publication';
  token: string;
  currentUser: any;

  constructor(
    private http: HttpClient,
    private securityService: SecurityService,
  ) {
    this.token = String(this.securityService.getToken());
    this.currentUser = this.securityService.getDataToken(this.token);
  }

  getPublicationsById(id: string): Observable<PublicationModel[]> {
    return this.http.get<PublicationModel[]>(
      `${ServiceConfig.BASE_URL}/people/${id}/publications`
    )
  }

  getAllMyPublications(): Observable<PublicationModel[]> {
    return this.http.get<PublicationModel[]>(
      `${ServiceConfig.BASE_URL}/people/${this.currentUser.id}/publications`
    )
  }

  postPublication(newPublicationAll: PublicationModel): Observable<PublicationModel> {
    let {
      categories,
      ...newPublication
    } = newPublicationAll;

    return this.http.post<PublicationModel>(
      `${ServiceConfig.BASE_URL}/people/${this.currentUser.data.id}/publications`,
      newPublication,
      {
        headers: new HttpHeaders({
          Authorization: `Bearer ${this.token}`,
        }),
      }
    );
  }

  linkPublicationWithCategories(id: string, categories: string[]): Observable<any> {
    return this.http.post(
      `${ServiceConfig.BASE_URL}/publications/${id}/link-categories`,
      categories
    )
  }
}

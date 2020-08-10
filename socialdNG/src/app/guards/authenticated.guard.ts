import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { SecurityService } from '../services/security.service';

@Injectable({
  providedIn: 'root'
})
export class AuthenticatedGuard implements CanActivate {
  constructor(
    private secSecurity: SecurityService,
    private router: Router
  ){

  }
  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
      if(this.secSecurity.sessionExist()){
        return true;
      }else{
        this.router.navigate(["/security/login"])
        return false;
      }
  }
  
}

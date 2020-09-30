import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'latest',
  templateUrl: './latest.component.html',
  styleUrls: ['./latest.component.scss']
})
export class LatestComponent implements OnInit {

  public isFavorite = false;

  constructor() { }

  ngOnInit(): void {
  }

  public makeFavorite(): void {
    this.isFavorite = !this.isFavorite;
  }
}

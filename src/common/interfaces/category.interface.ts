import { IPagination } from './app.interface';

export interface ISearchObject extends IPagination {
  searchText?: string;
}

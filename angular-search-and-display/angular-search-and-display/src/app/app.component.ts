import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { BehaviorSubject, Observable, catchError, filter, map, switchMap } from 'rxjs';
import { CurrentSearch, SEARCH_CONFIG, SearchService } from './services/search.service';

interface SearchResult {
  num_found: number;
  docs: {
    title: string;
    author_name: string[];
    cover_edition_key: string;
  }[];
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    MatPaginatorModule,
  ],
  // BONUS: Use DI to update the config of SearchService to update page size

  // 修改點 1: 增加 providers 配置
  // 原因: 提供 SearchService 及其配置
  providers: [
    SearchService,
    { provide: SEARCH_CONFIG, useValue: { defaultPageSize: 10 } }
  ],
  standalone: true
})
export class AppComponent implements OnDestroy  {
  private $http = inject(HttpClient);

  // TODO: Create a SearchService and use DI to inject it
  // Check app/services/search.service.ts for the implementation
  // $search = {
  //   searchText: 'lord of the rings',
  //   pageSize: 10,
  //   page: 1,
  //   currentSearch$: new BehaviorSubject<CurrentSearch>({
  //     searchText: '',
  //     pageSize: 10,
  //     page: 1,
  //   }),
  //   submit: () => {},
  // };

  // 修改點 2: 使用依賴注入替換硬編碼的物件
  // 原因: 使用真實的 SearchService 替換模擬物件
  $search = inject(SearchService);

  // 追蹤搜尋結果的總數
  totalResults = 0;

  // 以下是預設的書本
  // TODO: Implement this observable to call the searchBooks() function
  // Hint: Use RxJS operators to solve these issues
  // searchResults$ = this.$search.currentSearch$.pipe(
  //   map(() => ({
  //     num_found: 2,
  //     docs: [
  //       {
  //         title: 'The Lord of the Rings',
  //         author_name: ['J.R.R. Tolkien'],
  //         cover_edition_key: 'OL27702422M',
  //       },
  //       {
  //         title: 'The Hobbit',
  //         author_name: ['J.R.R. Tolkien'],
  //         cover_edition_key: 'OL27702423M',
  //       },
  //     ],
  //   }))
  // );

  // 修改點 3: 實作完整的 searchResults$ Observable
  // 原因: 處理實際的搜尋邏輯和錯誤情況
  searchResults$ = this.$search.currentSearch$.pipe(
    // 1. 過濾掉 null 值，確保型別安全
    // 2. 只在有搜尋參數且搜尋文字不為空時才進行 API 調用
    filter((search): search is CurrentSearch => 
      search !== null && search.searchText.trim().length > 0
    ),
    // 切換到新的搜尋請求，自動取消舊的請求
    switchMap(search => this.searchBooks(search)),
    // 錯誤處理：記錄錯誤並返回空結果
    catchError(error => {
      console.error('Search error:', error);
      return new BehaviorSubject<SearchResult>({ num_found: 0, docs: [] });
    })
  );

    // 保持原有的輸入處理方法
  onSearchInputChange(event: Event) {
    const searchText = (event.target as HTMLInputElement).value;
    // 使用新的 newSearch 方法，會自動重置分頁、處理空值的情況
    this.$search.newSearch(searchText);
  }

  // 處理分頁事件
  onPageChange(event: PageEvent) {
    // 更新頁面大小（如果有變更）
    if (event.pageSize !== this.$search.pageSize) {
      this.$search.setPageSize(event.pageSize);
    } else {
      // 否則只更新頁碼
      this.$search.setPage(event.pageIndex + 1);
    }
  }

    // 保持原有的搜尋方法
  searchBooks(currentSearch: CurrentSearch): Observable<SearchResult> {
    const { searchText, pageSize, page } = currentSearch;

    const searchQuery = searchText.split(' ').join('+').toLowerCase();

    return this.$http.get<SearchResult>(
      `https://openlibrary.org/search.json?q=${searchQuery}&page=${page}&limit=${pageSize}`
    );
  }

  ngOnDestroy() {
    this.$search.getCancelSubject().complete();
  }
}

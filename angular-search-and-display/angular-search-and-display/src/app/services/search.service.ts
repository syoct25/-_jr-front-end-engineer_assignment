import { Injectable, InjectionToken, Optional, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

interface SearchConfig {
  defaultPageSize?: number;
}

export interface CurrentSearch {
  searchText: string;
  pageSize: number;
  page: number;
}

export interface ISearchService {
  searchText: string;
  pageSize: number;
  page: number;
  currentSearch$: BehaviorSubject<CurrentSearch | null>;
  submit(): void;
}

// BONUS: Use DI to update the config of SearchService to update page size
// export const SEARCH_CONFIG = undefined;
// 修改點 1: 將 undefined 改為 InjectionToken
// 原因: 為了實現依賴注入配置功能，需要一個唯一的 token 來識別配置
export const SEARCH_CONFIG = new InjectionToken<SearchConfig>('SEARCH_CONFIG');

@Injectable()
export class SearchService implements ISearchService {
  searchText = '';
  // pageSize = 10;
  pageSize: number;  // 修改點 2: 移除初始值，改為從配置注入
  page = 1;
  currentSearch$ = new BehaviorSubject<CurrentSearch | null>(null);

  // constructor(private router: Router) {
  //   this._initFromUrl();
  // }

  // 修改點 3: 增加配置注入
  // 原因: 允許外部配置預設的分頁大小
  constructor(
    private router: Router,
    @Optional() @Inject(SEARCH_CONFIG) config?: SearchConfig
  ) {
    // 使用注入的配置或預設值
    this.pageSize = config?.defaultPageSize || 10;
    this._initFromUrl();
  }

  // BONUS: Keep the current search params in the URL that allow users to refresh the page and search again
  // private _initFromUrl() {}

  // 修改點 4: 實作 _initFromUrl 方法
  // 原因: 實現 URL 參數管理，支援頁面重整後保持狀態
  private _initFromUrl() {
    // 從 URL 讀取搜尋參數
    const params = new URLSearchParams(window.location.search);
    const searchText = params.get('q') || '';
    const page = parseInt(params.get('page') || '1', 10);
    const pageSize = parseInt(params.get('limit') || this.pageSize.toString(), 10);

    // 更新服務狀態
    this.searchText = searchText;
    this.page = page;
    this.pageSize = pageSize;

    // 如果有搜尋文字，自動執行搜尋
    if (searchText) {
      this.submit();
    }
  }

  // submit() {}
  
  // 修改點 5: 實作 submit 方法
  // 原因: 處理搜尋提交邏輯，包括 URL 更新和狀態通知
  submit() {
    // 更新 URL 參數
    // 使用 null 來移除空值的參數，保持 URL 簡潔
    this.router.navigate([], {
      queryParams: {
        q: this.searchText || null,
        page: this.page || null,
        limit: this.pageSize || null
      },
      queryParamsHandling: 'merge'  // 保留其他參數
    });

    // 通知訂閱者新的搜尋參數
    this.currentSearch$.next({
      searchText: this.searchText,
      pageSize: this.pageSize,
      page: this.page
    });
  }
}

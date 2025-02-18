/**
 * 引入所需的 Angular 核心模組
 * Import required Angular core modules
 */
import { Injectable, InjectionToken, Optional, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Subject } from 'rxjs';

/**
 * 搜尋配置介面
 * Search configuration interface
 * @interface SearchConfig
 * @property {number} defaultPageSize - 預設每頁顯示數量 / Default number of items per page
 */
interface SearchConfig {
  defaultPageSize?: number;
}

/**
 * 當前搜尋狀態介面
 * Current search state interface
 * @interface CurrentSearch
 * @property {string} searchText - 搜尋文字 / Search text
 * @property {number} pageSize - 每頁顯示數量 / Number of items per page
 * @property {number} page - 當前頁碼 / Current page number
 */
export interface CurrentSearch {
  searchText: string;
  pageSize: number;
  page: number;
}

/**
 * 搜尋服務介面
 * Search service interface
 * @interface ISearchService
 */
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
/**
 * 搜尋配置注入令牌
 * Search configuration injection token
 */
export const SEARCH_CONFIG = new InjectionToken<SearchConfig>('SEARCH_CONFIG');

/**
 * 搜尋服務類
 * Search service class
 */
@Injectable()
export class SearchService implements ISearchService {
  searchText = '';
  // pageSize = 10;
  pageSize: number;  // 修改點 2: 移除初始值，改為從配置注入
  page = 1;
  // 用於追蹤目前的搜尋狀態
    
  /**
   * 當前搜尋狀態的 BehaviorSubject
   * BehaviorSubject for current search state
   */
  currentSearch$ = new BehaviorSubject<CurrentSearch | null>(null);

  // 用於取消進行中的請求
  /**
   * 用於取消搜尋的 Subject
   * Subject for cancelling ongoing search
   */
  private cancelSearch$ = new Subject<void>();


  // constructor(private router: Router) {
  //   this._initFromUrl();
  // }
  /**
   * 搜尋服務建構函數
   * Search service constructor
   * @param router - Angular 路由服務 / Angular router service
   * @param config - 搜尋配置 / Search configuration
   */
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
  /**
   * 從 URL 初始化搜尋參數
   * Initialize search parameters from URL
   */
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

    // 如果有搜尋文字，自動執行搜尋(只在有搜尋文字時才執行搜尋)
    if (searchText.trim()) {
      this.submit();
    }
  }

  /**
   * 設置每頁顯示數量
   * Set the number of items per page
   * @param size - 每頁數量 / Items per page
   */
  setPageSize(size: number) {
    this.pageSize = size;
    this.page = 1; // 重置到第一頁
    this.submit();
  }

  /**
   * 設置當前頁碼
   * Set the current page number
   * @param page - 頁碼 / Page number
   */
  setPage(page: number) {
    this.page = page;
    this.submit();
  }

  /**
   * 重置分頁到第一頁
   * Reset pagination to first page
   */
  resetPagination() {
    this.page = 1;
  }

  /**
   * 獲取取消搜尋的 Subject
   * Get the Subject for cancelling search
   */
  getCancelSubject() {
    return this.cancelSearch$;
  }

  /**
   * 提交搜尋
   * Submit search
   */
  submit() {
    // 檢查搜尋文字是否為空
    if (!this.searchText.trim()) {
      // 如果為空，清空搜尋結果並返回
      this.currentSearch$.next(null);
      // 更新 URL，移除搜尋相關參數
      this.router.navigate([], {
        queryParams: {
          q: null,
          page: null,
          limit: null
        },
        queryParamsHandling: 'merge'
      });
      return;
    }

    // 取消先前的請求
    this.cancelSearch$.next();

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

  /**
   * 處理新的搜尋文字
   * Handle new search text
   * @param searchText - 搜尋文字 / Search text
   */
  newSearch(searchText: string) {
    this.searchText = searchText.trim();
    this.resetPagination(); // 重置到第一頁

    // 只在有搜尋文字時才執行搜尋
    if (this.searchText) {
      this.submit();
    } else {
      // 如果搜尋文字為空，清空結果
      this.currentSearch$.next(null);
    }
  }
}

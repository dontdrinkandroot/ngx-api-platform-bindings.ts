import {HttpClient, HttpParams} from '@angular/common/http';
import {Inject, Injectable, InjectionToken} from '@angular/core';
import {Observable} from 'rxjs';
import {CollectionResult} from './collection-result';
import {map} from 'rxjs/operators';
import {PartialCollectionView} from './partial-collection-view';
import {StringUtils, UrlInfo} from '@dontdrinkandroot/angular-extensions';

export const REST_API_BASE = new InjectionToken<string>('DDR_API_PLATFORM_REST_API_BASE');

@Injectable({
    providedIn: 'root'
})
export class RestApiService
{
    protected restApiBaseInfo: UrlInfo;

    constructor(protected httpClient: HttpClient, @Inject(REST_API_BASE) protected restApiBase: string)
    {
        this.restApiBaseInfo = UrlInfo.parse(restApiBase);
    }

    public getRestApiBase(): string
    {
        return StringUtils.stripTrailingSlash(this.restApiBase);
    }

    public getSingleResult<T>(url: string, params?: HttpParams | { [param: string]: string | string[]; }): Observable<T>
    {
        return this.httpClient.get(url, {params}).pipe(map((result) => {
            return this.transformToSingleResult(result);
        }));
    }

    public getCollectionResult<T>(
        url: string,
        params: {} = {}
    ): Observable<CollectionResult<T>>
    {
        return this.httpClient.get(url, {params}).pipe(map((result) => {
            return this.transformToCollectionResult<T>(result);
        }));
    }

    public putSingleResult<T>(
        url: string, body: any = null, params?: HttpParams | { [param: string]: string | string[]; }): Observable<T>
    {
        return this.put<T>(url, body, params).pipe(map((result) => {
            return this.transformToSingleResult<T>(result);
        }));
    }

    public postSingleResult<T>(
        url: string, body: any = null, params?: HttpParams | { [param: string]: string | string[]; }): Observable<T>
    {
        return this.post<T>(url, body, params).pipe(map((result) => {
            return this.transformToSingleResult<T>(result);
        }));
    }

    public post<T>(
        url: string, body: any = null, params?: HttpParams | { [param: string]: string | string[]; }): Observable<T>
    {
        return this.httpClient.post<T>(url, body, {params});
    }

    public put<T>(
        url: string, body: any = null, params?: HttpParams | { [param: string]: string | string[]; }): Observable<T>
    {
        return this.httpClient.put<T>(url, body, {params}).pipe(map((result) => {
            return this.transformToSingleResult<T>(result);
        }));
    }

    public delete(
        url: string, body: any = null,
        params?: HttpParams | { [param: string]: string | string[]; }
    ): Observable<object>
    {
        const httpOptions = {
            params,
            body
        };

        return this.httpClient.delete(url, httpOptions);
    }

    protected absolutizeUrl(url: string): string | null
    {
        if (null == url) {
            return url;
        }

        return this.restApiBaseInfo.getRoot() + url;
    }

    protected prepareEntity<T>(data: any): T
    {
        if (null != data && data.hasOwnProperty('@id')) {
            data['@href'] = this.absolutizeUrl(data['@id']);

            /* Check for embedded sub entities */
            for (const property in data) {
                if (data.hasOwnProperty(property)) {
                    const propertyValue = data[property];
                    if ('object' === typeof propertyValue) {
                        if (Array.isArray(propertyValue)) {
                            propertyValue.forEach((element) => {
                                this.prepareEntity(element);
                            });
                        } else {
                            this.prepareEntity(propertyValue);
                        }
                    }
                }

            }
        }

        return data;
    }

    public transformToSingleResult<T>(result: any): T
    {
        return this.prepareEntity(result);
    }

    public transformToCollectionResult<T>(result: any): CollectionResult<T>
    {
        const collectionResult = new CollectionResult<T>();

        for (let member of result['hydra:member']) {
            member = this.prepareEntity(member);
            collectionResult.push(member);
        }

        collectionResult.totalItems = result['hydra:totalItems'];

        if (result.hasOwnProperty('hydra:view')) {
            collectionResult.partialCollectionView = this.transformToPartialCollectionView(result['hydra:view']);
        }

        return collectionResult;
    }

    protected transformToPartialCollectionView(viewData: any): PartialCollectionView
    {
        const partialCollectionView = new PartialCollectionView();
        partialCollectionView.first = this.absolutizeUrl(viewData['hydra:first']);
        partialCollectionView.next = this.absolutizeUrl(viewData['hydra:next']);
        partialCollectionView.previous = this.absolutizeUrl(viewData['hydra:previous']);
        partialCollectionView.last = this.absolutizeUrl(viewData['hydra:last']);

        return partialCollectionView;
    }
}

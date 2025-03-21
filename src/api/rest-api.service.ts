import {HttpClient, HttpParams} from '@angular/common/http';
import {Inject, Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {CollectionResult} from './collection-result';
import {map} from 'rxjs/operators';
import {PartialCollectionView} from './partial-collection-view';
import {StringUtils, UrlInfo} from '@dontdrinkandroot/ngx-extensions';
import {DDR_REST_API_BASE} from '../ddr-api-platform-bindings.module';

@Injectable({
    providedIn: 'root'
})
export class RestApiService
{
    protected restApiBaseInfo: UrlInfo;

    constructor(protected httpClient: HttpClient, @Inject(DDR_REST_API_BASE) protected restApiBase: string)
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

    public patchSingleResult<T>(
        url: string, body: any = null, params?: HttpParams | { [param: string]: string | string[]; }): Observable<T>
    {
        return this.httpClient.patch<T>(url, body, {params}).pipe(map((result) => {
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

    public patch<T>(
        url: string, body: any = null, params?: HttpParams | { [param: string]: string | string[]; }): Observable<T>
    {
        return this.httpClient.patch<T>(url, body, {params}).pipe(map((result) => {
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
        if (null != data && Object.hasOwn(data, '@id')) {
            data['@href'] = this.absolutizeUrl(data['@id']);

            /* Check for embedded sub entities */
            for (const property in data) {
                if (Object.hasOwn(data, property)) {
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
        let partialCollectionView = null;
        if (Object.hasOwn(result, 'hydra:view')) {
            partialCollectionView = this.transformToPartialCollectionView(result['hydra:view']);
        }

        const collectionResult = new CollectionResult<T>(
            result['hydra:totalItems'],
            partialCollectionView
        );

        for (let member of result['hydra:member']) {
            member = this.prepareEntity(member);
            collectionResult.push(member);
        }

        return collectionResult;
    }

    protected transformToPartialCollectionView(viewData: any): PartialCollectionView
    {
        return new PartialCollectionView(
            this.absolutizeUrl(viewData['hydra:first']),
            this.absolutizeUrl(viewData['hydra:next']),
            this.absolutizeUrl(viewData['hydra:previous']),
            this.absolutizeUrl(viewData['hydra:last'])
        );
    }
}

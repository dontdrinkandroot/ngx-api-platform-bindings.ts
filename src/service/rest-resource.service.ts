import {Observable, throwError} from 'rxjs';
import {RestApiService} from '../api/rest-api.service';
import {JsonLdResource} from '../resource/json-ld-resource';
import {CollectionResult} from '../api/collection-result';

export abstract class RestResourceService<T>
{
    constructor(protected restApiService: RestApiService, protected endpointPath: string)
    {
    }

    public find(id: any): Observable<T>
    {
        return this.restApiService.getSingleResult(this.getResourceUrl(id));
    }

    public list(params: {} = {}): Observable<CollectionResult<T>>
    {
        return this.restApiService.getCollectionResult(this.getEndpointUrl(), params);
    }

    public save(resource: T | JsonLdResource): Observable<T>
    {
        if (null != resource['@href']) {
            return this.restApiService.putSingleResult(resource['@href'], resource);
        } else {
            return this.restApiService.postSingleResult(this.getEndpointUrl(), resource);
        }
    }

    public delete(resource: T | JsonLdResource): Observable<any>
    {
        if (null == resource['@href']) {
            return throwError('No @href found for resource');
        }

        return this.restApiService.delete(resource['@href']);
    }

    protected getEndpointUrl(): string
    {
        return this.restApiService.getRestApiBase() + this.endpointPath;
    }

    protected getResourceUrl(uuid: string): string
    {
        return this.getEndpointUrl() + '/' + uuid;
    }
}

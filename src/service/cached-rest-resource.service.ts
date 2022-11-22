import {RestResourceService} from './rest-resource.service';
import {BehaviorSubject, Observable} from 'rxjs';
import {map, shareReplay, switchMap, tap} from 'rxjs/operators';
import {CollectionResult} from '../api/collection-result';
import {CollectionUtils} from '@dontdrinkandroot/ngx-extensions';
import {JsonLdResource} from '../resource/json-ld-resource';

export abstract class CachedRestResourceService<T extends object> extends RestResourceService<T>
{
    private nodeUriHash: Map<string, T & JsonLdResource> | null = null;

    private refresh$ = new BehaviorSubject(Date.now());

    private listResult$: Observable<CollectionResult<T & JsonLdResource>> | null = null;

    public override list(params: {} = {}): Observable<CollectionResult<T & JsonLdResource>>
    {
        /* If no custom parameters are defined cache the list result. */
        if (Object.keys(params).length === 0) {
            if (null == this.listResult$) {
                this.listResult$ = this.refresh$.pipe(
                    switchMap(() => super.list({...{pagination: false}, ...params})),
                    tap(result => this.postProcessListResult(result)),
                    shareReplay(1),
                );
            }

            return this.listResult$;
        }

        return super.list(params);
    }

    public refresh()
    {
        this.refresh$.next(Date.now());
    }

    public resolve(resource: string | (T & JsonLdResource) | null): Observable<(T & JsonLdResource) | null>
    {
        return this.list().pipe(
            map(() => {
                if (null == resource) {
                    return null;
                }

                if ('string' === typeof resource) {
                    if (null == this.nodeUriHash) {
                        throw new Error('Node URI Hash was not initialized');
                    }
                    return this.nodeUriHash.get(resource) ?? null;
                }

                return resource;
            })
        );
    }

    protected postProcessListResult(result: CollectionResult<T & JsonLdResource>)
    {
        this.nodeUriHash = CollectionUtils.mapByProperty(result, '@id');
    }
}

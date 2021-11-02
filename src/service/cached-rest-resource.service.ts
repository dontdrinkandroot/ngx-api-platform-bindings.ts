import {RestResourceService} from './rest-resource.service';
import {BehaviorSubject, Observable} from 'rxjs';
import {map, shareReplay, switchMap, tap} from 'rxjs/operators';
import {CollectionResult} from '../api/collection-result';
import {CollectionUtils} from '@dontdrinkandroot/ngx-extensions';
import {JsonLdResource} from '../resource/json-ld-resource';

export abstract class CachedRestResourceService<T extends object> extends RestResourceService<T>
{
    private nodeUriHash: Map<string, T> = null;

    private refresh$ = new BehaviorSubject(undefined);

    private listResult$: Observable<CollectionResult<T>>;

    /**
     * @override
     */
    public list(params: {} = {}): Observable<CollectionResult<T>>
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
        this.refresh$.next(undefined);
    }

    public resolve(resource: string | T | null): Observable<T | null>
    {
        return this.list().pipe(
            map(() => {
                if (null == resource) {
                    return null;
                }

                if ('string' === typeof resource) {
                    return this.nodeUriHash.get(resource);
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

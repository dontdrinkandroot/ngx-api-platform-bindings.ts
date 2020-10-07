import {PartialCollectionView} from './partial-collection-view';

export class CollectionResult<T> extends Array<T>
{
    public totalItems: number;

    public partialCollectionView: PartialCollectionView;
}

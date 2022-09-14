import {PartialCollectionView} from './partial-collection-view';

export class CollectionResult<T> extends Array<T>
{
    constructor(public readonly totalItems: number, public readonly partialCollectionView: PartialCollectionView | null)
    {
        super(0);
    }
}

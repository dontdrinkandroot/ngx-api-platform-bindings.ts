export class PartialCollectionView
{
    constructor(
        public readonly first: string | null,
        public readonly next: string | null,
        public readonly previous: string | null,
        public readonly last: string | null
    )
    {
    }
}

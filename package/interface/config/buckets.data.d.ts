export interface BucketsData {
    code: number;
    message: string;
    buckets: Array<BucketInfo>;
}
export interface BucketInfo {
    id: number;
    publicOrPrivate: string;
    name: string;
}

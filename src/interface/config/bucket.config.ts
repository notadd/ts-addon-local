export interface BucketConfig {
    isPublic: boolean;

    name: string;

    tokenExpire: number;

    tokenSecretKey: string;
}

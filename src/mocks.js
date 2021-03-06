export const MOCK_CONTEXT = {};

export const MOCK_S3_SOURCE_BUCKET = 'fake_bucket';

export const MOCK_EVENT_CREATE = {
	RequestType: 'Create',
	ResourceProperties: {
		BucketNames: ['fake_bucket_1', 'fake_bucket_2'],
	},
};

export const MOCK_EVENT_DELETE_BUCKETS = {
	RequestType: 'Delete',
	ResourceProperties: {
		BucketNames: ['fake_bucket_1', 'fake_bucket_2', 'fake_bucket_3'],
	},
};

export const MOCK_EVENT_DELETE_BUCKETS_EMPTY = {
	RequestType: 'Delete',
	ResourceProperties: {
		BucketNames: [],
	},
};

export const MOCK_EVENT_DELETE_BUCKETS_EMPTY_NO_PROP = {
	RequestType: 'Delete',
	ResourceProperties: {},
};

export const MOCK_ERROR_S3_BUCKET_NOT_EXIST = {
	message: 'The specified bucket does not exist',
	code: 'NoSuchBucket',
	statusCode: 404,
	retryable: false,
};

export const MOCK_ERROR_S3_BUCKET_UNKNOWN = {
	message: 'Unknown Error',
	code: 'Unknown Error',
	statusCode: 999,
	retryable: false,
};

export const generateDummyObjectList = (num) =>
	Array.from({ length: num }, (value, key) => ({ Key: `objectKey${key}` }));

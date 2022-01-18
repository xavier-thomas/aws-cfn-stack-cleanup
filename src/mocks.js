export const MOCK_CONTEXT = {};

export const MOCK_S3_SOURCE_BUCKET = 'fake_bucket';

export const MOCK_LOG_GROUP = 'fake_log_group';

export const MOCK_EVENT_CREATE = {
	RequestType: 'Create',
	ResourceProperties: {
		BucketNames: ['fake_bucket_1', 'fake_bucket_2'],
		LogGroupNames: ['fake_log_group_1'],
	},
};

export const MOCK_EVENT_DELETE_RESOURCES = {
	RequestType: 'Delete',
	ResourceProperties: {
		BucketNames: ['fake_bucket_1', 'fake_bucket_2', 'fake_bucket_3'],
		LogGroupNames: ['fake_log_group_1', 'fake_log_group_2'],
	},
};

export const MOCK_EVENT_DELETE_EMPTY = {
	RequestType: 'Delete',
	ResourceProperties: {
		BucketNames: [],
		LogGroupNames: [],
	},
};

export const MOCK_EVENT_DELETE_EMPTY_NO_PROP = {
	RequestType: 'Delete',
	ResourceProperties: {},
};

export const MOCK_ERROR_S3_BUCKET_NOT_EXIST = {
	message: 'The specified bucket does not exist',
	code: 'NoSuchBucket',
	statusCode: 404,
	retryable: false,
};

export const MOCK_ERROR_CWL_NOT_EXIST = {
	message: 'The specified log group does not exist',
	code: 'ResourceNotFoundException',
	statusCode: 404,
	retryable: false,
};

export const MOCK_ERROR_S3_BUCKET_UNKNOWN = {
	message: 'Unknown Error',
	code: 'Unknown Error',
	statusCode: 999,
	retryable: false,
};

export const MOCK_ERROR_CWL_UNKNOWN = {
	message: 'Unknown Error',
	code: 'Unknown Error',
	statusCode: 999,
	retryable: false,
};

export const generateDummyObjectList = (num) =>
	Array.from({ length: num }, (value, key) => ({ Key: `objectKey${key}` }));

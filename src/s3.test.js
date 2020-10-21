jest.mock('aws-sdk');
import { MOCK_S3_SOURCE_BUCKET } from './mocks';
import { deleteBucket, emptyBucket } from './s3.js';
import AWS from 'aws-sdk';

describe('[s3.js] unit tests', () => {
	const generateDummyObjectList = (num) => Array.from({ length: num }, (value, key) => ({ Key: `objectKey${key}` }));

	const mock_deleteBucket = jest.fn();
	const mock_deleteObjects = jest.fn();
	const mock_listObjectsV2 = jest.fn();

	const mock_emptyBucket = jest.fn();

	// What to do before test is executed
	beforeEach(() => {
		jest.restoreAllMocks();
		AWS.S3.mockImplementation(() => ({
			deleteBucket: mock_deleteBucket,
			deleteObjects: mock_deleteObjects,
			listObjectsV2: mock_listObjectsV2,
		}));
		jest.spyOn(console, 'error').mockImplementation(() => {});
		jest.spyOn(console, 'info').mockImplementation(() => {});
		jest.spyOn(console, 'log').mockImplementation(() => {});
	});

	// What to do after each test is executed
	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('[deleteBucket] when a bucket name is passed', () => {
		it('must first empty then delete the bucket when the bucket exists', async () => {
			mock_deleteBucket.mockReturnValue({
				promise: jest.fn().mockResolvedValue({}),
			});

			mock_emptyBucket.mockReturnValue({
				promise: jest.fn().mockResolvedValue({}),
			});

			const response = await deleteBucket(MOCK_S3_SOURCE_BUCKET, mock_emptyBucket);

			expect(mock_deleteBucket).toHaveBeenCalledWith({
				Bucket: MOCK_S3_SOURCE_BUCKET,
			});

			expect(mock_emptyBucket).toHaveBeenCalledTimes(1);
			expect(mock_emptyBucket).toHaveBeenCalledWith({
				Bucket: MOCK_S3_SOURCE_BUCKET,
			});

			expect(response).toEqual({});
		});
	});
});

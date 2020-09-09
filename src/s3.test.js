import { MOCK_S3_SOURCE_BUCKET } from './mocks';
import { deleteBucket, emptyBucket } from './s3.js';
import AWS from 'aws-sdk';
jest.mock('aws-sdk');

describe('[s3.js] unit tests', () => {
	const generateDummyObjectList = (num) => Array.from({ length: num }, (value, key) => ({ Key: `objectKey${key}` }));

	const mockDeleteBucket = jest.fn();
	const mockDeleteObjects = jest.fn();
	const mockListObjectsV2 = jest.fn();

	// What to do before test is executed
	beforeEach(() => {
		AWS.S3.mockImplementation(() => ({
			deleteBucket: mockDeleteBucket,
			deleteObjects: mockDeleteObjects,
			listObjectsV2: mockListObjectsV2,
		}));
		jest.spyOn(console, 'error').mockImplementation(() => {});
		jest.spyOn(console, 'info').mockImplementation(() => {});
		jest.spyOn(console, 'log').mockImplementation(() => {});
	});

	// What to do after each test is executed
	afterEach(() => {
		jest.clearAllMocks();
		jest.restoreAllMocks();
	});

	describe('[deleteBucket] when a bucket name is passed', () => {
		it('must first empty then delete the bucket when the bucket exists', async () => {
			mockDeleteBucket.mockReturnValue({
				promise: jest.fn().mockResolvedValue({}),
			});

			emptyBucket.mockReturnValue({
				promise: jest.fn().mockResolvedValue({}),
			});

			const response = await deleteBucket(MOCK_S3_SOURCE_BUCKET);

			expect(mockDeleteBucket).toHaveBeenCalledWith({
				Bucket: MOCK_S3_SOURCE_BUCKET,
			});

			expect(emptyBucket).toHaveBeenCalledTimes(1);
			expect(emptyBucket).toHaveBeenCalledWith({
				Bucket: MOCK_S3_SOURCE_BUCKET,
			});

			expect(response).toEqual({});
		});
	});
});

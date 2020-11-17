import * as emptyBucket from './emptyBucket';
import { MOCK_ERROR_S3_BUCKET_NOT_EXIST, MOCK_ERROR_S3_BUCKET_UNKNOWN, MOCK_S3_SOURCE_BUCKET } from './mocks';
import { S3 } from 'aws-sdk';
import { deleteBucket } from './deleteBucket';

jest.mock('aws-sdk');

describe('[s3.js] unit tests', () => {
	const mock_deleteBucket = jest.fn();
	const mock_deleteObjects = jest.fn();
	const mock_listObjectsV2 = jest.fn();

	// What to do before test is executed
	beforeEach(() => {
		jest.restoreAllMocks();
		S3.mockImplementation(() => ({
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
			jest.spyOn(emptyBucket, 'emptyBucket').mockResolvedValue({});
			mock_deleteBucket.mockResolvedValue({});
			const response = await deleteBucket(MOCK_S3_SOURCE_BUCKET);
			expect(mock_deleteBucket).toHaveBeenCalledWith({
				Bucket: MOCK_S3_SOURCE_BUCKET,
			});
			expect(emptyBucket.emptyBucket).toHaveBeenCalledTimes(1);
			expect(emptyBucket.emptyBucket).toHaveBeenCalledWith(MOCK_S3_SOURCE_BUCKET);
			expect(console.info).toHaveBeenCalledWith(`Bucket: [${MOCK_S3_SOURCE_BUCKET}] deleted.`);
			expect(response).toEqual({});
		});

		it('must ignore a bucket not found error as the bucket may have already been deleted', async () => {
			jest.spyOn(emptyBucket, 'emptyBucket').mockResolvedValue({});
			mock_deleteBucket.mockRejectedValue(MOCK_ERROR_S3_BUCKET_NOT_EXIST);
			const response = await deleteBucket(MOCK_S3_SOURCE_BUCKET);
			expect(console.info).toHaveBeenCalledWith(
				`Bucket: [${MOCK_S3_SOURCE_BUCKET}] not found. May have already been deleted.`
			);
			expect(response).toEqual();
		});

		it('must throw all other errors', async () => {
			jest.spyOn(emptyBucket, 'emptyBucket').mockResolvedValue({});
			mock_deleteBucket.mockRejectedValue(MOCK_ERROR_S3_BUCKET_UNKNOWN);
			await expect(deleteBucket(MOCK_S3_SOURCE_BUCKET)).rejects.toThrowError(
				`Error Deleting Bucket: [fake_bucket] - Unknown Error`
			);
			expect(console.info).not.toHaveBeenCalled();
		});

		// TODO: Test an error being thrown by the empty bucket function
	});
});

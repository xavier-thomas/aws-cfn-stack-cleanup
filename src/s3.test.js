import {
	MOCK_ERROR_S3_BUCKET_NOT_EXIST,
	MOCK_ERROR_S3_BUCKET_UNKNOWN,
	MOCK_S3_SOURCE_BUCKET,
	generateDummyObjectList,
} from './mocks';
import { deleteBucket, emptyBucket } from './s3.js';
import { S3Client } from '@aws-sdk/client-s3';

jest.mock('@aws-sdk/client-s3');

describe('[s3.js] unit tests', () => {
	const mock_deleteBucket = jest.fn();
	const mock_deleteObjects = jest.fn();
	const mock_listObjectsV2 = jest.fn();
	const mock_emptyBucket = jest.fn();

	// What to do before test is executed
	beforeEach(() => {
		jest.restoreAllMocks();
		S3Client.mockImplementation(() => ({
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
			mock_deleteBucket.mockResolvedValue({});

			mock_emptyBucket.mockResolvedValue({});

			const response = await deleteBucket(MOCK_S3_SOURCE_BUCKET, mock_emptyBucket);

			expect(mock_deleteBucket).toHaveBeenCalledWith({
				Bucket: MOCK_S3_SOURCE_BUCKET,
			});
			expect(mock_emptyBucket).toHaveBeenCalledTimes(1);
			expect(mock_emptyBucket).toHaveBeenCalledWith(MOCK_S3_SOURCE_BUCKET);
			expect(console.info).toHaveBeenCalledWith(`Bucket: [${MOCK_S3_SOURCE_BUCKET}] deleted.`);
			expect(response).toEqual({});
		});

		it('must ignore a bucket not found error as the bucket may have already been deleted', async () => {
			mock_deleteBucket.mockRejectedValue(MOCK_ERROR_S3_BUCKET_NOT_EXIST);
			const response = await deleteBucket(MOCK_S3_SOURCE_BUCKET, mock_emptyBucket);
			expect(console.info).toHaveBeenCalledWith(
				`Bucket: [${MOCK_S3_SOURCE_BUCKET}] not found. May have already been deleted.`
			);
			expect(response).toEqual();
		});

		it('must throw all other errors', async () => {
			mock_deleteBucket.mockRejectedValue(MOCK_ERROR_S3_BUCKET_UNKNOWN);

			await expect(deleteBucket(MOCK_S3_SOURCE_BUCKET, mock_emptyBucket)).rejects.toThrowError(
				`Error Deleting Bucket: [fake_bucket] - Unknown Error`
			);
			expect(console.info).not.toHaveBeenCalled();
		});

		// TODO: Test an error being thrown by the empty bucket function
	});
	//
	describe('[emptyBucket] when a bucket name is passed', () => {
		it('must first list objects in the bucket', async () => {
			mock_listObjectsV2.mockResolvedValueOnce({
				Contents: generateDummyObjectList(1),
			});
			mock_deleteObjects.mockResolvedValueOnce({
				Deleted: generateDummyObjectList(1),
			});
			const response = await emptyBucket(MOCK_S3_SOURCE_BUCKET);
			expect(mock_listObjectsV2).toHaveBeenCalledTimes(1);
			expect(mock_deleteObjects).toHaveBeenCalledTimes(1);
			expect(response).toBeUndefined();
		});

		it('must return success if there are no objects in the bucket', async () => {
			mock_listObjectsV2.mockResolvedValueOnce({
				Contents: generateDummyObjectList(0),
			});
			const response = await emptyBucket(MOCK_S3_SOURCE_BUCKET);
			expect(mock_listObjectsV2).toHaveBeenCalledTimes(1);
			expect(mock_deleteObjects).not.toHaveBeenCalled();
			expect(response).toBeUndefined();
		});

		it('must ignore a bucket not found error as the bucket may have already been deleted', async () => {
			mock_listObjectsV2.mockRejectedValue(MOCK_ERROR_S3_BUCKET_NOT_EXIST);

			const response = await emptyBucket(MOCK_S3_SOURCE_BUCKET);
			expect(mock_listObjectsV2).toHaveBeenCalledTimes(1);
			expect(mock_deleteObjects).not.toHaveBeenCalled();
			expect(response).toBeUndefined();
		});

		it('must throw all other errors generated while listing objects', async () => {
			mock_listObjectsV2.mockRejectedValue(MOCK_ERROR_S3_BUCKET_UNKNOWN);

			await expect(emptyBucket(MOCK_S3_SOURCE_BUCKET)).rejects.toThrowError(
				`Error Listing Objects in Bucket: [fake_bucket] - Unknown Error`
			);
			expect(mock_listObjectsV2).toHaveBeenCalledTimes(1);
			expect(mock_deleteObjects).not.toHaveBeenCalled();
		});

		it('must log the number of files deleted', async () => {
			const count = 500;
			mock_listObjectsV2.mockResolvedValueOnce({
				Contents: generateDummyObjectList(count),
			});
			mock_deleteObjects.mockResolvedValueOnce({
				Deleted: generateDummyObjectList(count),
			});
			const response = await emptyBucket(MOCK_S3_SOURCE_BUCKET);
			expect(console.info).toHaveBeenCalledWith(`Deleted [${count}] objects from Bucket: [${MOCK_S3_SOURCE_BUCKET}].`);
			expect(mock_listObjectsV2).toHaveBeenCalledTimes(1);
			expect(mock_deleteObjects).toHaveBeenCalledTimes(1);
			expect(response).toBeUndefined();
		});

		it('must throw all errors generated while deleting objects', async () => {
			mock_listObjectsV2.mockResolvedValueOnce({
				Contents: generateDummyObjectList(10),
			});
			mock_deleteObjects.mockRejectedValue(MOCK_ERROR_S3_BUCKET_UNKNOWN);

			await expect(emptyBucket(MOCK_S3_SOURCE_BUCKET)).rejects.toThrowError(
				`Error Deleting Objects in Bucket: [fake_bucket] - Unknown Error`
			);
			expect(mock_listObjectsV2).toHaveBeenCalledTimes(1);
			expect(mock_deleteObjects).toHaveBeenCalledTimes(1);
		});

		it('must recursively call itself when there are more than 1000 objects in the bucket', async () => {
			mock_listObjectsV2
				.mockResolvedValueOnce({
					Contents: generateDummyObjectList(1000),
				})
				.mockResolvedValueOnce({
					Contents: generateDummyObjectList(100),
				});
			mock_deleteObjects
				.mockResolvedValueOnce({
					Deleted: generateDummyObjectList(1000),
				})
				.mockResolvedValueOnce({
					Deleted: generateDummyObjectList(100),
				});

			const result = await emptyBucket(MOCK_S3_SOURCE_BUCKET);

			expect(mock_listObjectsV2).toHaveBeenCalledTimes(2);
			expect(mock_deleteObjects).toHaveBeenCalledTimes(2);
			expect(console.info).toHaveBeenCalledWith(`Deleted [1100] objects from Bucket: [${MOCK_S3_SOURCE_BUCKET}].`);

			expect(result).toBeUndefined();
		});
	});
});
